#include <iostream>
#include <limits>
#include <algorithm>
#include <iomanip>
#include <sstream>
#include <cassert>

#include <QFile>
#include <QString>
#include <QTextStream>
#include <QFileInfo>
#include <QImage>
#include <QDir>
#include <QFileInfo>
#include <QTemporaryFile>
#include <QColor>
#include <QTime>

#include "extractor.h"
#include "DoubleFile.h"
#include "PngFileCompressor.h"

using namespace std;

static void reportMemUsage( const QString & msg = "...")
{
    cerr << "+--------- Memory Usage -------------------\n";
    cerr << "| " << msg.toStdString() << "\n";
    pid_t pid = getpid();
    QString fname = QString("/proc/%1/status").arg(pid);
    QFile fp( fname);
    if( fp.open( QFile::ReadOnly)) {
        QTextStream in( & fp);
        while ( true) {
            QString line = in.readLine();
            if( line.isNull()) break;
            if( line.startsWith( "VmPeak:") || line.startsWith( "VmSize:"))
                cerr << "| " << line.toStdString() << "\n";
        }
    } else {
        cerr << "| Failed to open " << fname.toStdString() << "!!!\n";
    }
    cerr << "+------------------------------------------\n";
}

// this is used to sort the keys when writing header file
// returns float for easier management down the road... :)
static float keywordPriority( const QString & key)
{
    if( key == "SIMPLE") return 0;
    if( key == "BITPIX") return 1;
    if( key == "NAXIS") return 2;
    if( key == "NAXIS1") return 3;
    if( key == "NAXIS2") return 4;
    if( key == "NAXIS3") return 5;
    if( key == "NAXIS4") return 6;
    if( key == "NAXIS5") return 7;
    if( key == "END") return numeric_limits<float>::max();
    return 1000000;
}

// FitsLine represents a single entry in the Fits header (I think it's called a card... :)
struct FitsLine {
    FitsLine( const QString & rawLine ) {
        _raw = rawLine;
    }
    QString raw() { return _raw; }
    QString key() { QString k, v, c; parse( k, v, c); return k; }
    QString value() { QString k, v, c; parse( k, v, c); return v; }
    QString comment() { QString k, v, c; parse( k, v, c); return c; }
    // parse the line into key/value/comment
    void parse( QString & key, QString & value, QString & comment ) {
        // key is the first 8 characters (trimmed)
        key = _raw.left(8).trimmed();
        // by default, value & comment are empty
        value = comment = QString();
        // if there is no equal sign present, return the default values for value/comment, which is empty
        if( _raw.mid( 8, 2).trimmed() != "=") return;
        // find the start/end of the value
        //   start = first non-white character
        //   end   = last character of the value (if string, it's the closing quote, otherwise it's the last non-space
        int vStart = 10, vEnd = -1;
        while( _raw[vStart].isSpace()) { vStart ++; if( vStart >= 80) { vStart = -1; break; }}
        if( vStart == -1) // entire line is empty after the '='
            return;
        if( _raw[vStart] != '\'') { // it's an unquoted value
            // non-string value, find the end
            vEnd = _raw.indexOf( '/', vStart + 1); if( vEnd != -1) vEnd --; else vEnd = 79;
//            vEnd = vStart + 1;
//            while( ! _raw[vEnd].isSpace()) { if( vEnd >= 80) break; else vEnd ++; }
//            vEnd --;
        } else { // it's s quoted string
            // temporarily remove all occurrences of double single-quotes and then find the next single quote
            QString tmp = _raw; for(int i=0;i<=vStart;i++){tmp[i]=' ';} tmp.replace( "''", "..");
            vEnd = tmp.indexOf( '\'', vStart + 1);
            if( vEnd == -1) // we have an unterminated string here
                throw QString( "Unterminated string in header for %1").arg(key);
        }
        // now that we know start/end, get the value
        value = _raw.mid( vStart, vEnd - vStart + 1).trimmed();

        // if this was a string value, get rid of the double single-quotes permanently, and remove the surrounding quotes too
        //if( value[0] == '\'') value = value.mid( 1, value.length()-2).replace( "''", "'");

        // is there a comment?
        comment = _raw.mid( vEnd + 1).trimmed();
        if( ! comment.isEmpty()) {
            if( comment[0] != '/')
                throw ("Syntax error in header: " + _raw.trimmed());
            else
                comment.remove(0,1);
        }
    }


protected:
    QString _raw;
};

// represents a FITS header
struct FitsHeader
{
    // do the parse of the fits file
    static FitsHeader parse( QFile & f );
    // write the header to a file
    bool write( QFile & f);
    // was the parse successful?
    bool isValid() const { return _valid; }
    // find a line with a given key
    int findLine( const QString & key ) {
        for( size_t i = 0 ; i < _lines.size() ; i ++ )
            if( _lines[i].key() == key )
                return i;
        return -1;
    }
    qint64 dataOffset() const { return _dataOffset; }
    std::vector< FitsLine > & lines() { return _lines; }

    // add a raw line to the header
    void addRaw( const QString & line );

    // sets a value in the header
    void setIntValue( const QString & key, int value, const QString & comment = QString());
    void setDoubleValue(const QString & pkey, double value, const QString & pcomment = QString());

    // general access function to key/values, does not throw exceptions but can return
    // variant with isValid() = false
    QVariant getValue( const QString & key, QVariant defaultValue = QVariant());

    // convenience functions that lookup key and convert it to requested type
    // all these throw exceptions if (a) key is not defined (b) key does not have a value
    // that can be converted to the requested type:

    // find a line with 'key' and conver it's 'value' to integer
    int intValue( const QString & key );
    int intValue( const QString & key, int defaultValue);
    QString stringValue( const QString & key );
    QString stringValue( const QString & key, const QString & defaultValue);
    double doubleValue( const QString & key );
    double doubleValue( const QString & key, double defaultValue);


protected:
    // where does the data start? This is set only in parse()! Bad design, I know.
    qint64 _dataOffset;
    // is this header valid? This is also only set in parse();
    bool _valid;
    // the lines
    std::vector< FitsLine > _lines;
    // protected constructor
    FitsHeader() { _valid = false; _dataOffset = 0; }
    // convenienty 80 spaces string
    static QString space80;
};

QString FitsHeader::space80 = "                                                                                ";

// convenience function to convert quoted strings found in FITS files to javascript strings
static QString fitsString2js( const QString & s)
{
    if( s.length() < 2) throw "fitsString2js - string less than 2 characters.";
    QString res = s;
    // remove the leading and ending quotes
    res[0] = res[ res.length()-1] = ' ';
    // replace all double single-quotes with an escaped quote
    res.replace( "''", "\\'");
    // replace the quotes
    res[0] = res[ res.length()-1] = '\"';

    return res;
}

// convenience function to convert fits string to a raw string (removing intial quotes & replacing all double quotes with single ones)
static QString fitsString2raw( const QString & s)
{
    if( s.length() < 2) throw "fitsString2raw - string less than 2 characters.";
    QString res = s;
    // remove the leading and ending quotes
    res[0] = res[ res.length()-1] = ' ';
    // replace all double single-quotes with a single quote
    res.replace( "''", "'");

    return res;
}

// remove leading/trailing spaces from a fits string
static QString fitsStringTrimmed( const QString & s)
{
    return QString( "\"%1\"").arg(fitsString2raw(s).trimmed());
}

// wrapper around regular QFile::read() - it makes sure to read in requested size 's' if possible
bool blockRead( QFile & f, char * ptr, qint64 s)
{
    qint64 remaining = s;
    while( remaining > 0 ) {
        qint64 d = f.read( (char *) ptr, remaining);
        if( d <= 0 ) {
            cerr << "Error: blockRead(): could not read another block.\n";
            return false;
        }
        // update remaining & ptr
        ptr += d;
        remaining -= d;
    }
    return true;
}

// wrapper around regular QFile::write() - it makes sure to write in requested size 's' if possible
bool blockWrite( QFile & f, const char * ptr, qint64 s)
{
    qint64 remaining = s;
    while( remaining > 0 ) {
        qint64 d = f.write( (const char *) ptr, remaining);
        if( d <= 0 ) {
            cerr << "Error: blockWrite(): could not write another block\n";
            return false;
        }
        // update remaining & ptr
        ptr += d;
        remaining -= d;
    }
    return true;
}

// fits header parser
FitsHeader FitsHeader::parse( QFile & f)
{
    FitsHeader hdr;

    // read in header one 'line' (or card) at a time, which is 80 bytes
    // until we find one that conains END
    while( 1)
    {
        // read in another header block
        char block[80];
        if( ! blockRead( f, block, 80)) {
            cerr << "Error: FitsHeader::parse() could not read card.\n";
            return hdr;
        }

        // clean up the block by converting anything outside of ASCII [32..126]
        // to spaces
        for( size_t i = 0 ; i < sizeof( block) ; i ++ )
            if( block[i] < 32 || block[i] > 126)
                block[i] = ' ';

        // data offset moves
        hdr._dataOffset += sizeof( block);

        // parse the block: one line at a time (there are 36 lines of 80 chars each,
        // but they are not \0 terminated!!!)
        QString rawLine = QByteArray( (char *) block, sizeof( block) );
        // add this line to the header
        hdr._lines.push_back( rawLine);
        // if this is the 'END' line, terminate the parse
        if( rawLine.startsWith( "END     " ))
            break;
    }
    // adjust offset to be a multiple of 2880
    hdr._dataOffset = ((hdr._dataOffset -1)/ 2880 + 1) * 2880;
    // return this header
    hdr._valid = true;
    return hdr;
}

// will write out the header to a file
// after sorting the lines by keyword priority and if keyword priority is the same then by
// the current line position
bool FitsHeader::write(QFile & f)
{
    // sort the lines based on a) keword priority, b) their current order
    //vector< pair< QString, pair< double, int> > > lines;
    typedef pair<QString, pair<double,int> > SortLine;
    vector<SortLine> lines;
    for( size_t i = 0 ; i < _lines.size() ; i ++ )
        lines.push_back( make_pair(_lines[i].raw(), make_pair( keywordPriority( _lines[i].key()), i)));
    // c++ does not support anonymous functions, but it does support local structures/classes with
    // static functions... go figure :)
    struct local { static bool cmp( const SortLine & v1, const SortLine & v2 ) {
        // use std::pair built in comparison, it compares first to first, and only if equal
        // it compares second to second
        return( v1.second < v2.second );
    }};
    std::sort( lines.begin(), lines.end(), local::cmp);
    // put all strings into one big array of bytes for wrting
    QByteArray block;
    for( size_t i = 0 ; i < lines.size() ; i ++ )
        block.append( (lines[i].first + space80).left(80)); // paranoia
    // pad with spaces so that the block is a multiple of 2880 bytes
    while( block.size() % 2880 )
        block.append( ' ');
//    cerr << "FitsHeader::write() block size = " << block.size() << " with " << lines.size() << " lines\n";
//    for( size_t i = 0 ; i < lines.size() ; i ++ )
//        cerr << lines[i].first.toStdString() << "\n";
    if( ! blockWrite( f, block.constData(), block.size()))
        return false;
    else
        return true;
}

// get a value from the header as int - throwing an exception if this fails!
int FitsHeader::intValue( const QString & key)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        throw QString("Could not find key %1 in fits file.").arg(key);
    bool ok;
    int result = value.toInt( & ok);
    if( ! ok )
        throw QString("Found %1=%2 in fits file but expected an integer.").arg(key).arg(value.toString());

    // value converted, return it
    return result;
}

// get a value from the header as int - throwing an exception if this fails!
int FitsHeader::intValue( const QString & key, int defaultValue)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        return defaultValue;
    bool ok;
    int result = value.toInt( & ok);
    if( ! ok )
        throw QString("Found %1=%2 in fits file but expected an integer.").arg(key).arg(value.toString());

    // value converted, return it
    return result;
}


// get a value from the header as double - throwing an exception if this fails!
double FitsHeader::doubleValue( const QString & key)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        throw QString("Could not find key %1 in fits file.").arg(key);
    bool ok;
    double result = value.toDouble( & ok);
    if( ! ok )
        throw QString("Found %1=%2 in fits file but expected a double.").arg(key).arg(value.toString());

    // value converted, return it
    return result;
}

// get a value from the header as double - substituting default value if needed!
double FitsHeader::doubleValue( const QString & key, double defaultValue)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        return defaultValue;
    bool ok;
    double result = value.toDouble( & ok);
    if( ! ok )
        throw QString("Found %1=%2 in fits file but expected a double.").arg(key).arg(value.toString());

    // value converted, return it
    return result;
}


// get a value from the header as string - throwing an exception if this fails!
QString FitsHeader::stringValue( const QString & key)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        throw QString("Could not find key %1 in fits file.").arg(key);
    return value.toString();
}

// get a value from the header as string - throwing an exception if this fails!
QString FitsHeader::stringValue( const QString & key, const QString & defaultValue)
{
    QVariant value = getValue( key);
    if( ! value.isValid())
        return defaultValue;
    return value.toString();
}


// get a value from the header as int
QVariant FitsHeader::getValue( const QString & key, QVariant defaultValue)
{
    // find the line with this key
    int ind = findLine( key);

    // if there is no such line, report error
    if( ind < 0 )
        return defaultValue;

    // return the value as qvariant
    return QVariant( _lines[ind].value());
}

// set an integer value
void FitsHeader::setIntValue(const QString & pkey, int value, const QString & pcomment)
{
    QString key = (pkey + space80).left(8);
    QString comment = (pcomment + space80).left( 47);
    // construct a line based on the parameters
    QString rawLine = QString( "%1= %2 /  %3").arg( key, -8).arg( value, 20).arg( comment);
    rawLine = (rawLine + space80).left(80); // just in case :)
    // find a line with this key so that we can decide if we are adding a new line or
    // replacing an existing one
    int ind = findLine( pkey);
    if( ind < 0 )
        _lines.push_back( rawLine);
    else
        _lines[ind] = rawLine;
}

// set a double value
void FitsHeader::setDoubleValue(const QString & pkey, double value, const QString & pcomment)
{
    QString space80 = "                                                                                ";
    QString key = (pkey + space80).left(8);
    QString comment = (pcomment + space80).left( 47);
    // construct a line based on the parameters
    QString rawLine = QString( "%1= %2 /  %3").arg( key, -8).arg( value, 20, 'G', 10).arg( comment);
    rawLine = (rawLine + space80).left(80); // just in case :)
    // find a line with this key so that we can decide if we are adding a new line or
    // replacing an existing one
    int ind = findLine( pkey);
    if( ind < 0 )
        _lines.push_back( rawLine);
    else
        _lines[ind] = rawLine;
}

// insert a raw line into fits - no syntax checking is done, except making sure it's padded to 80 chars
void FitsHeader::addRaw(const QString & line)
{
    _lines.push_back( (line + space80).left(80));
}

// simple 3D array
template <class T> struct M3D {
    M3D( int dx, int dy, int dz ) {
        _raw.fill( 0, dx * dy * dz * sizeof(T));
        // cerr << "M3D allocated " << _raw.size() << " bytes\n";
        _dx = dx; _dy = dy; _dz = dz;
    }
    char * raw() { return _raw.data(); }
    T & operator()(int x, int y, int z) {
        qint64 ind = z; ind = ind * _dy + y; ind = ind * _dx + x; ind *= sizeof(T);
        return * (T *) (_raw.constData() + ind);
    }
    void reset() { _raw.fill(0); }
//    void reset() { memset( (void *) _raw.constData(), 0, _raw.size()); }

    QByteArray _raw;
    int _dx, _dy, _dz;
};

// simple 2D array
template <class T> struct M2D {
    M2D( int dx, int dy ) {
        _raw.fill( 0, dx * dy * sizeof(T));
        // cerr << "M2D allocated " << _raw.size() << " bytes\n";
        _dx = dx; _dy = dy;
    }
    char * raw() { return _raw.data(); }
    T & operator()(int x, int y) {
        qint64 ind = (y * _dx + x) * sizeof(T);
        if( ind < 0 || ind >= _raw.size()) throw "M2D out of bounds";
        return * (T *) (_raw.constData() + ind);
    }
    void reset() { _raw.fill(0); }

    QByteArray _raw;
    int _dx, _dy;
};

// buffered 3D FITS cube accessor (by index x,y,z), specific to BITPIX = -32 (i.e. floats)
// almost acts as a 3D matrix but the data is stored on the disk
struct M3DFloatFile{
    M3DFloatFile( QFile * fp, qint64 offset, int dx, int dy, int dz) {
        _fp = fp; _offset = offset; _dx = dx; _dy = dy; _dz = dz;
        _buffStart = _buffEnd = -1;
        _buffSize = 4096;
        _buff = new char[ _buffSize];
        if( ! _buff) throw QString( "Could not allocate buffer");
    }
    ~M3DFloatFile() { delete[] _buff; }
    float operator()(int x, int y, int z) {
        qint64 ind = z; ind = ind * _dy + y; ind = ind * _dx + x; ind *= 4; ind += _offset;
        // if buffer does not yet point to what we need, read in stuff into buffer
        if( ind < _buffStart || ind + 3 > _buffEnd ) {
            qint64 req = _buffSize;
            if( ! _fp-> seek( ind)) throw QString( "Failed to seek to extract a float");
            qint64 len = _fp-> read( _buff, req);
            // cerr << "Reading " << ind << " + " << req << " --> " << len << "\n";
            if( len < 4) throw QString( "Failed to read");
            _buffStart = ind;
            _buffEnd = _buffStart + len - 1;
        }
        char * p = _buff + (ind - _buffStart);
        float val; uchar * d = (uchar *) (& val);
        d[0] = p[3]; d[1] = p[2]; d[2] = p[1]; d[3] = p[0];
        return val;
    }

    QFile * _fp; qint64 _offset; int _dx, _dy, _dz;
    char * _buff;
    qint64 _buffStart, _buffEnd, _buffSize;
};

// given a raw bitpix value (as found in FITS files), returns the number of bytes
// which is basically abs(bitpix)/8
static int bitpixToSize( int bitpix )
{
    if( bitpix == 8 ) return 1;
    if( bitpix == 16 ) return 2;
    if( bitpix == 32 ) return 4;
    if( bitpix == -32 ) return 4;
    if( bitpix == -64 ) return 8;

    throw QString( "Illegal value BITPIX = %1").arg( bitpix);
}


// values extracted from the fits header
// only 'interesting values' are extracted, basically the ones needed to
// complete the extraction, and ones that the fits viewer can use
struct Fits {
    int bitpix;
    int naxis;
    int naxis1, naxis2, naxis3;
    double bscale, bzero;
    double crpix1, crpix2, crpix3, crval1, crval2, crval3, cdelt1, cdelt2, cdelt3;
    QString ctype1, ctype2, ctype3, cunit3, bunit;
    double equinox;
    int blank; bool hasBlank;
    QString bmaj, bmin, bpa;
};

// buffered 3D FITS cube accessor (by index x,y,z)
// almost acts as a 3D matrix but the data is stored on the disk
struct M3DBitpixFile {
    M3DBitpixFile( Fits fits, QFile * fp, qint64 offset, int dx, int dy, int dz) {
        _fp = fp; _offset = offset; _dx = dx; _dy = dy; _dz = dz; _fits = fits;
        _dataSize = bitpixToSize( _fits.bitpix);
        _buffStart = _buffEnd = -1; // indicate invalid buffer
        _buffSize = 4096;
        _buff = new char[ _buffSize];
        if( ! _buff) throw QString( "Could not allocate buffer");
    }
    ~M3DBitpixFile() { delete[] _buff; }
    double operator()(int x, int y, int z) {
        qint64 ind = z; ind = ind * _dy + y; ind = ind * _dx + x; ind *= _dataSize; ind += _offset;
        // if buffer does not yet point to what we need, read in stuff into buffer
        if( ind < _buffStart || ind + _dataSize -1 > _buffEnd ) {
            qint64 req = _buffSize;
            if( ! _fp-> seek( ind)) throw QString( "Failed to seek to extract data");
            qint64 len = _fp-> read( _buff, req);
            if( len < _dataSize) {
                throw QString( "failed to read the minimum (%1").arg( _dataSize);
            }
            _buffStart = ind;
            _buffEnd = _buffStart + len - 1;
        }
        char * p = _buff + (ind - _buffStart);
        // put the endian-adjusted bytes to 'tmp'
        char tmpBuff[8];
        std::reverse_copy( p, p + _dataSize, tmpBuff);

        // convert the raw bytes to an initial double
        double original; char * tmp = tmpBuff;
        switch( _fits.bitpix) {
        case   8: original = double( * (quint8 *) tmp); break;
        case  16: original = double( * (qint16 *) tmp); break;
        case  32: original = double( * (qint32 *) tmp); break;
        case  64: original = double( * (qint64 *) tmp); break;
        case -32: original = double( * ( float *) tmp); break;
        case -64: original = double( * (double *) tmp); break;
        default: throw QString( "Illegal value BITPIX = %1").arg( _fits.bitpix);
        }

        // check to see if we should apply BLANK
        if( _fits.hasBlank && original == _fits.bzero + _fits.blank * _fits.bscale)
            return std::numeric_limits<double>::quiet_NaN();
        else
            return _fits.bzero + _fits.bscale * original;
    }

    QFile * _fp; qint64 _offset; int _dx, _dy, _dz, _dataSize;
    char * _buff;
    qint64 _buffStart, _buffEnd, _buffSize;
    Fits _fits;

//    double convertRawDataToDouble( char * p)
//    {
//        double original;
//        switch( _fits.bitpix) {
//        case   8: original = double( * (quint8 *) p); break;
//        case  16: original = double( * (qint16 *) p); break;
//        case  32: original = double( * (qint32 *) p); break;
//        case  64: original = double( * (qint64 *) p); break;
//        case -32: original = double( * ( float *) p); break;
//        case -64: original = double( * (double *) p); break;
//        default: throw QString( "Illegal value BITPIX = %1").arg( _fits.bitpix);
//        }
//        // check to see if we should apply BLANK
//        if( _fits.hasBlank && original == _fits.bzero + _fits.blank * _fits.bscale)
//            return std::numeric_limits<double>::quiet_NaN();
//        else
//            return _fits.bzero + _fits.bscale * original;
//    }

};


// histogram bin calculation & testing methods
struct Histogram {
    // given a desired percentile <p>, a cumulative & normalized distribution of values <nh>, the min/max values of the original data,
    // it will return upper/lower bounds (as std::pair) for the desired percentile
    static std::pair<double,double> percentile( double p, const std::vector<double> & nh, double min, double max) {
        size_t ind1 = getIndex( (1-p) / 2, nh);
        size_t ind2 = getIndex( p + (1-p)/2, nh);
        double x1 = ind1 / double( nh.size());
        double x2 = ind2 / double( nh.size());
        double v1 = (1-x1) * min + x1 * max;
        double v2 = (1-x2) * min + x2 * max;

        return std::make_pair( v1, v2);
    }
    static size_t getIndex( double x, const std::vector<double> & nh ) {
        for( size_t i = 0 ; i < nh.size() ; i ++ )
            if( nh[i] > x) return i;
        return nh.size();
    }
    static double test( double min, double max, M2D<double> & a, Fits & fits) {
        int count = 0, total = 0;
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
                double v = a(sx, sy);
                if( v >= min && v <= max) count ++;
                if( isfinite(v)) total ++;
            }
        }
        return count * 100.0 / total;
    }
    static double test2( double min, double max, M3DBitpixFile & a, Fits & fits, int frame) {
        int count = 0, total = 0;
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
                double v = a(sx, sy, frame);
                if( v >= min && v <= max) count ++;
                if( isfinite(v)) total ++;
            }
        }
        return count * 100.0 / total;
    }

    static double test3( double min, double max, const std::vector<double> & nh) {
    	double sum = 0;
        for( size_t i = 0 ; i < nh.size() ; i ++ ) {
        	double v = nh[i];
        	if( v >= min && v <= max) sum += v;
        }
        return sum;
    }
};

class Chunk {
public:
    Chunk( const QString dirName) {
        _count = 0;
        _stream = 0;
        _fp = 0;
        _dirName = dirName;
    }
    void next() {
        close();
        _count ++;
        _fname = QString( "%1/chunk%2.js").arg( _dirName).arg( _count);
//        cerr << "opening " << _fname.toStdString() << "\n";
        _fp = new QFile( _fname);
        if( ! _fp-> open( QFile::WriteOnly | QFile::Truncate))
            throw QString( "Could not open %1 for writing").arg( _fname);
        _stream = new QTextStream( _fp);
    }
    void close() {
        if( ! _fp) return;

//        cerr << "closing " << _fname.toStdString() << "\n";

        _stream-> flush(); delete _stream; _stream = 0;
        _fp->close(); delete _fp; _fp = 0;
    }
    ~Chunk() {
        close();
    }

    int count() {
        return _count;
    }

    QString _dirName;
    QString _fname;
    QTextStream * _stream;
    QFile * _fp;
    int _count;
};


// this has to be sitting outside if we want to use full template specialization, as gcc
// does not allow template specialization of a method only... wth
template <typename T>
Chunk & operator << ( Chunk & chunk, const T & val) {
    if( ! chunk._stream)
        throw "Internal error. Trying to write to a closed chunk.";
    ( * chunk._stream) << val;
    return chunk;
}

// special case for doubles
template <>
Chunk & operator << <double> ( Chunk & chunk, const double & val) {
    if( ! chunk._stream)
        throw "Internal error. Trying to write to a closed chunk.";
//    chunk._stream-> setRealNumberPrecision( std::numeric_limits<double>::digits10 + 2);
    ( * chunk._stream) << val;

    return chunk;
}


// extracts a frame of a FITS image
void extractFitsFrame( const QString & fitsIn, int frame, int tileSize)
{
    reportMemUsage( "Starting extractFitsFrame()");

    // open input fits file
    QFile f( fitsIn);
    if( ! f.open( QFile::ReadOnly))
        throw QString( "Could not open input file %1").arg( fitsIn);

    // parse the header
    FitsHeader hdr = FitsHeader::parse(f);
    if( ! hdr.isValid())
        throw QString( "Could not parse FITS header");

    // extract some parameters from the fits file and also validate it a bit
    Fits fits;
    if( hdr.stringValue("SIMPLE") != "T" )
        throw "Input FITS file does not have 'SIMPLE = T'";
    fits.bitpix = hdr.intValue( "BITPIX");
    (void) bitpixToSize( fits.bitpix); // throw an exception if BITPIX is invalid
//    if( fits.bitpix != -32 )
//        throw QString( "Cannot handle files with BITPIX = %1, only BITPIX = -32").arg( fits.bitpix);
    fits.naxis = hdr.intValue( "NAXIS");
    if( fits.naxis < 2)
            throw QString( "Cannot deal with files that have NAXIS = %1").arg(fits.naxis);
    fits.naxis1 = hdr.intValue( "NAXIS1");
    fits.naxis2 = hdr.intValue( "NAXIS2");
    fits.naxis3 = hdr.intValue( "NAXIS3", 1);
    if( fits.naxis == 2) {
        fits.naxis = 3; fits.naxis3 = 1; // simulate 3d cube with 1 frame
    }

    QVariant blank = hdr.getValue( "BLANK");
    if( blank.isValid()) {
        fits.blank = hdr.intValue( "BLANK");
        fits.hasBlank = true;
        // blank is only supported for BITPIX > 0
        if( fits.bitpix < 0)
            throw QString( "Invalid use of BLANK = %1 keyword with BITPIX = %2.").arg( fits.blank).arg( fits.bitpix);
    } else {
        fits.hasBlank = false;
    }

    // calculate the number of frames in this fits file (this is basically a product
    // of NAXIS3 * NAXIS4 * ... * NAXISn
    int nFrames = 1;
    for( int i = 3 ; i <= hdr.intValue( "NAXIS") ; i ++ )
        nFrames *= hdr.intValue( QString("NAXIS%1").arg(i));
    cerr << "This fits file has " << nFrames << " frames.\n";
//    if( frame >= fits.naxis3)
//        throw QString( "Requested frame (%1) is invalid. NAXIS3 = %2").arg(frame).arg(fits.naxis3);
    if( ! (frame >= 0 && frame < nFrames))
        throw QString( "Requested frame (%1) is invalid. File has = %2 frames").arg(frame).arg(nFrames);

    fits.bzero = hdr.doubleValue( "BZERO", 0);
    fits.bscale = hdr.doubleValue( "BSCALE", 1);
    fits.crval1 = hdr.doubleValue( "CRVAL1", 0);
    fits.crval2 = hdr.doubleValue( "CRVAL2", 0);
    fits.crval3 = hdr.doubleValue( "CRVAL3", 0);
    fits.cdelt1 = hdr.doubleValue( "CDELT1", 1);
    fits.cdelt2 = hdr.doubleValue( "CDELT2", 1);
    fits.cdelt3 = hdr.doubleValue( "CDELT3", 1);
    fits.crpix1 = hdr.doubleValue( "CRPIX1", 0);
    fits.crpix2 = hdr.doubleValue( "CRPIX2", 0);
    fits.crpix3 = hdr.doubleValue( "CRPIX3", 0);
    fits.ctype1 = hdr.stringValue( "CTYPE1", "''");
    fits.ctype2 = hdr.stringValue( "CTYPE2", "''");
    fits.ctype3 = hdr.stringValue( "CTYPE3", "''");
    fits.cunit3 = hdr.stringValue( "CUNIT3", "''");
    fits.bunit = hdr.stringValue( "BUNIT", "''"); fits.bunit = fitsStringTrimmed( fits.bunit);
    fits.equinox = hdr.doubleValue( "EQUINOX", 2000.0);
    fits.bmaj = hdr.stringValue( "BMAJ", "\"\"" );
    fits.bmin = hdr.stringValue( "BMIN", "\"\"" );
    fits.bpa = hdr.stringValue( "BPA", "\"\"" );

    // make sure the data segment following header is big enough for the data
    qint64 inputSize = f.size();
    qint64 s = fits.naxis1 * fits.naxis2 * fits.naxis3 * bitpixToSize( fits.bitpix);
    qint64 offset = hdr.dataOffset();
    if( offset + s > inputSize)
        throw QString( "Invalid fits file size. Maybe accidentally truncated?");

    // position the input to the offset
    if( ! f.seek( offset))
        throw QString( "Could not read the data (seek failed)");

    reportMemUsage( "About to construct M3DBitPixFile");


    // extract the frame - this is actually totally unnecessary, but w/e :)
    M3DBitpixFile src(fits, & f, offset, fits.naxis1, fits.naxis2, fits.naxis3);
//    M2D<double> frameData( fits.naxis1, fits.naxis2 );
    double min = src(0,0,frame);
    double max = min;
    bool first = true;
    qint64 nanCount = 0;
    reportMemUsage( "About to construct histCopy");
    std::vector<double> histCopy; histCopy.reserve(fits.naxis1 * fits.naxis2); // make a copy for histogram calculation
    for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
        for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
            double v = src(sx, sy, frame);
//            frameData(sx,sy) = v;
            if( ! isfinite(v)) {
                nanCount ++;
                continue;
            }
            histCopy.push_back( v);
            if( first) {
                min = max = v; first = false;
            } else {
                min = std::min( min, v);
                max = std::max( max, v);
            }
        }
    }
    cout << "min/max = " << min << " " << max << "\n";
    cout << "nanCount = " << nanCount << " (" << (100.0 * nanCount) / fits.naxis1 / fits.naxis2 << "%)\n";

    //
    // write as javascript in chunks
    //
    DoubleFile header( "header.js");
    header << "{\n";

    // precalculate some histogram values, and remember the 99.5 value for calculating thumbnail
    double histMin995 = 0, histMax995 = 1;
    {
        header << "\"autoHist\": [\n";
        std::vector< std::pair< QString, double> > histVals;
        histVals.push_back( std::make_pair( "95",  95  ));
        histVals.push_back( std::make_pair( "98",  98  ));
        histVals.push_back( std::make_pair( "99",  99  ));
        histVals.push_back( std::make_pair( "99.5",99.5));
        histVals.push_back( std::make_pair( "99.9", 99.9));
        histVals.push_back( std::make_pair( "99.99",99.99));
        for( size_t i = 0 ; i < histVals.size() ; i ++ ) {
            double p = histVals[i].second / 100.0; QString name = histVals[i].first;
            int ind1 = int(((1-p)/2) * histCopy.size());
            int ind2 = histCopy.size() - ind1 - 1;
            nth_element( histCopy.begin(), histCopy.begin() + ind1, histCopy.end());
            double v1 = histCopy[ind1];
            nth_element( histCopy.begin(), histCopy.begin() + ind2, histCopy.end());
            double v2 = histCopy[ind2];
            if( histVals[i].second == 99.5) {
                histMin995 = v1; histMax995 = v2;
            }
//            std::cerr << "histogram for " << name.toStdString() << " = [" << v1 << " - " << v2
//            		<< "] check: "
//            		<< Histogram::test2(v1,v2,src, fits, frame)
//					<< "\n";
            header << QString( "{ \"name\": \"%1\", \"min\": %2, \"max\": %3 },\n").arg( name).arg(v1).arg(v2);
        }
        header << QString( "{ \"name\": \"%1\", \"min\": %2, \"max\": %3 } ],\n").arg( "Full range").arg(min).arg(max);
        reportMemUsage( "histCopy fully populated");
        histCopy.reserve(1);
        histCopy.clear();
    }

    reportMemUsage( "After trying to free up histcopy");

    // create a thumbnail using Pavol's resize :)
    // it uses very little memory compared to Qt's resize
    try {
        QTime timer; timer.start();
        struct anon {
            // calculate intersection of two intervals (a-b) and (x-y)
            // there are only 6 cases to handle
            static float inter( float a, float b, float x, float y) {
                float x1 = std::max(a,x), x2 = std::min(b,y);
                float diff = x2 - x1;
                return (diff < 0) ? 0 : diff;
            }
        };

        QSize tsize(fits.naxis1,fits.naxis2); tsize.scale(500,500,Qt::KeepAspectRatio);
        tsize = tsize.expandedTo(QSize(1,1));
        QImage thumb( tsize, QImage::Format_Indexed8);
        cerr << "Thumbnail size: " << thumb.width() << " x " << thumb.height() << "\n";
        // set regular grey level colormap
        for( int i = 0 ; i < 256 ; i ++ ) thumb.setColor( i, qRgb(i,i,i));
        // create 2D array of floats where we can store the thumbnail as it's computed
        std::vector< std::vector<float> >
                buff( thumb.height(), std::vector<float>( thumb.width(), 0.0));
        reportMemUsage( "Inside thumbnail with all memory allocated");

        float pixWidth = double( thumb.width()) / fits.naxis1;
        float pixHeight = double( thumb.height()) / fits.naxis2;
        float y1 = 0, y2 = pixHeight;
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ , y1 += pixHeight, y2 += pixHeight) {
            int iy1 = floor(y1);
            int iy2 = std::min<int>(floor(y2),thumb.height()-1);
            double x1 = 0, x2 = pixWidth;
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ , x1 += pixWidth, x2 += pixWidth) {
                double val = src(sx,sy,frame); int gray;
                if( isfinite(val)) {
                    gray = std::floor(255 * (val - histMin995) / (histMax995 - histMin995) + 0.5);
                    if( gray < 0) gray = 0; if( gray > 255) gray = 255;
                } else {
                    gray = 0;
                }
                // x1,2 and y1,2 represent a rectangle of pixel sx,sy in the thumbnail
                // paint this rectangle with color gray into buff
                int ix1 = floor(x1);
                int ix2 = std::min<int>(floor(x2),thumb.width()-1);
                for( int dy = iy1 ; dy <= iy2; dy ++) {
                    float h = anon::inter( y1, y2, dy, dy+1);
                    for( int dx = ix1 ; dx <= ix2 ; dx ++ ) {
                        // area of intersection of the rectangle with pixel dx,dy
                        float w = anon::inter( x1, x2, dx, dx+1);
                        float a = w*h;
                        buff[dy][dx] += a * gray;
                    }
                }
            }
        }
        // put buff into thumb
        for( int dy = 0 ; dy < thumb.height() ; dy ++ ) {
            for( int dx = 0 ; dx < thumb.width() ; dx ++ ) {
                int gray = round( buff[dy][dx]);
                if( gray < 0) gray = 0; else if( gray > 255) gray = 255;
                thumb.setPixel(dx,thumb.height() - dy - 1,gray);
            }
        }

        cerr << "Thumbnail computed in " << timer.elapsed() / 1000.0 << "s\n";
        // write out the thumbnail
        thumb.save("thumb.jpg", "JPG");
    } catch (...) {
        cerr << "Thumbnail failed\n";
    }
    reportMemUsage( "After thumbnail");

/*
    // create a thumbnail
    try {
        QTime timer; timer.start();
        cerr << "Creating thumbnail.\n";
        // for really large files we'll run out of memory so we need to account for that
        QImage thumb; int w = fits.naxis1, h = fits.naxis2;
        w = std::min( 36200, w); h = std::min( 31200, h);

        // try to create image w x h, and if that fails try lower and lower w/h
        while( true) {
            thumb = QImage( w, h, QImage::Format_Indexed8);
            if( thumb.width() == w && thumb.height() == h) break;
            cerr << "Could not create image of " << w << " x " << h << "\n";
            w /= 1.5; h /= 1.5;
            if( w < 64 && h < 64) {
                cerr << "I guess we won't make a thumbnail then.\n";
                break;
            }
        }
//        thumb = QImage( w, h, QImage::Format_Indexed8);
        cerr << "Thumbnail will be of size " << thumb.width() << " x " << thumb.height() << "\n";

        // set regular grey level colormap
        for( int i = 0 ; i < 256 ; i ++ ) thumb.setColor( i, qRgb(i,i,i));

        for( int sy = 0, dy = fits.naxis2 - 1 ; sy < fits.naxis2 ; sy ++, dy -- ) {
            if( dy >= thumb.height()) continue;
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
                if( sx >= thumb.width()) continue;
                double val = src(sx,sy,frame);
                if( isfinite(val)) {
                    int gray = std::floor(255 * (val - histMin995) / (histMax995 - histMin995) + 0.5);
                    if( gray < 0) gray = 0; if( gray > 255) gray = 255;
//                    thumb.setPixel(sx,dy, QColor(gray,gray,gray).rgb());
                    thumb.setPixel(sx,dy, gray);
                } else {
//                    thumb.setPixel(sx, dy, QColor(0,0,0).rgb()); // nans are black
                    thumb.setPixel(sx, dy, 0); // nans are black
                }
            }
        }
        cerr << "Trying to scale thumbnail\n";
//        thumb = thumb.scaled( 500, 300, Qt::KeepAspectRatio, Qt::SmoothTransformation);
        QImage sthumb = thumb.scaled( 500, 500, Qt::KeepAspectRatio, Qt::SmoothTransformation);
        if( 1 || sthumb.isNull()) {
            cerr << "Cannot use smooth, transformation, trying fast\n";
            sthumb = thumb.scaled( 500, 500, Qt::KeepAspectRatio, Qt::FastTransformation);
        }
        cerr << "thumb computed in " << timer.elapsed() / 1000.0 << "s\n";
        sthumb.save( "thumb3.png", "PNG");
        sthumb.save( "thumb.jpg", "JPG", 80);
    } catch (...) {
        cerr << "Thumbnail failed\n";
    }
    reportMemUsage( "After thumbnail");
    */

    header << "\"minValue\": " << min << ",\n";
    header << "\"maxValue\": " << max << ",\n";
    header << "\"naxis\": " << hdr.intValue( "NAXIS") << ",\n";
    header << "\"naxis1\": " << fits.naxis1 << ",\n";
    header << "\"naxis2\": " << fits.naxis2 << ",\n";
    header << "\"naxis3\": " << fits.naxis3 << ",\n";
    header << "\"crval1\": " << fits.crval1 << ",\n";
    header << "\"crval2\": " << fits.crval2 << ",\n";
    header << "\"crpix1\": " << fits.crpix1 << ",\n";
    header << "\"crpix2\": " << fits.crpix2 << ",\n";
    header << "\"cdelt1\": " << fits.cdelt1 << ",\n";
    header << "\"cdelt2\": " << fits.cdelt2 << ",\n";
    header << "\"ctype1\": " << fitsString2js( fits.ctype1) << ",\n";
    header << "\"ctype2\": " << fitsString2js( fits.ctype2) << ",\n";
    header << "\"equinox\": " << fits.equinox << ",\n";
    header << "\"bunit\": " << fitsString2js( fits.bunit) << ",\n";
    header << "\"fname\": \"" << fitsIn << "\",\n";
    header << "\"frame\": " << frame << ",\n";
    header << "\"bmaj\": " << fits.bmaj << ",\n";
    header << "\"bmin\": " << fits.bmin << ",\n";
    header << "\"bpa\": " << fits.bpa << ",\n";
    // add information about coordinates
    {
    	int naxis = hdr.doubleValue( "NAXIS");
        header << "\"coords\": [\n";
    	for( int i = 1 ; i <= naxis ; i ++ ) {
                header << QString("{").arg(i);
                header << "\"naxis\": " << hdr.doubleValue( QString("NAXIS%1").arg(i)) << ",\n";
                header << "\"crval\": " << hdr.doubleValue( QString("CRVAL%1").arg(i), 0) << ",\n";
                header << "\"cdelt\": " << hdr.doubleValue( QString("CDELT%1").arg(i), 1) << ",\n";
                header << "\"naxis\": " << hdr.doubleValue( QString("NAXIS%1").arg(i), 1) << ",\n";
    		double crpix = hdr.doubleValue( QString("CRPIX%1").arg(i), 0);
    		if( i == 3) // special case
				crpix = crpix - frame;
                header << "\"crpix\": " << crpix << ",\n";
                header << "\"ctype\": " << fitsStringTrimmed(
    				hdr.stringValue( QString("CTYPE%1").arg(i), "\"\"").toUpper()) << ",\n";
                header << "\"cunit\": " << fitsStringTrimmed(
    				hdr.stringValue( QString("CUNIT%1").arg(i), "\"\"").toUpper());
    		if (i == naxis)
                header << "} ],\n";
            else
            	header << "},\n";
    	}
    }
    // add the entire header
    {
        header << "\"hdr\": [\n";
    	for( size_t i = 0 ; i < hdr.lines().size() ; i ++) {
    		QString line = hdr.lines()[i].raw();
    		line.replace( "'", "");
    		line.replace( "\"","");
    		if (i == hdr.lines().size()-1) {
    			header << "{ \"content\": \"" + line + "\"} ],\n";
    			break;
    		}
                header << "{ \"content\": \"" + line + "\"},\n";
    	}
    }
    QString sliceTitle;
//    std::cerr << "naxis = " << fits.naxis << "\n";
    for( int i = 3 ; i <= fits.naxis ; i ++ ) {
        double x = 0;
        if( i == fits.naxis) x = frame;
        QString ctype = hdr.stringValue( QString("CTYPE%1").arg(i), "''");
        ctype = fitsString2raw( ctype).trimmed();
        QString cunit = hdr.stringValue( QString("CUNIT%1").arg(i), "''");
        cunit = fitsString2raw( cunit).trimmed();
        double crpix = hdr.doubleValue( QString("CRPIX%1").arg(i), 0.0);
        double crval = hdr.doubleValue( QString("CRVAL%1").arg(i), 0.0);
        double cdelt = hdr.doubleValue( QString("CDELT%1").arg(i), 1.0);
        double val = (frame - crpix + 1) * cdelt + crval;
        std::cerr << "val = " << val << "\n";
        QString valStr = QString("%1").arg(val);
        // special cases for known types
        if( ctype.toLower() == "stokes") {
            valStr = "?";
            if( val == 1) valStr = "I"; if( val == 2) valStr = "Q"; if( val == 3) valStr = "U"; if( val == 4) valStr = "V";
            ctype = "Stokes"; cunit = "";
        } else if( ctype.toLower().startsWith( "freq")) {
            if      ( val > 1e12) { val /= 1e12; cunit = "THz"; }
            else if ( val > 1e9 ) { val /= 1e9 ; cunit = "GHz"; }
            else if ( val > 1e6 ) { val /= 1e6 ; cunit = "MHz"; }
            else if ( val > 1e3 ) { val /= 1e3 ; cunit = "kHz"; }
            else                {            cunit = "Hz";  }
            ctype = "Frequency";
            valStr = QString( "%1").arg( val);
        }
        QString label = QString( "%1 %2 %3")
                     .arg( ctype)
                     .arg( valStr)
                     .arg( cunit);
        label = label.trimmed();
//        std::cerr << "label = " << label.toStdString() << "\n";
        if( label != "1") sliceTitle += label + "   ";
    }
    sliceTitle = sliceTitle.trimmed();
    sliceTitle.replace( "'", "\\'"); // escape single quotes
    header << "\"frameTitle\": \"" << sliceTitle << "\",\n";
    header << "\"tileSize\": " << tileSize << "\n}";
    header.close();

    for( int y = 0 ; y < fits.naxis2 ; y += tileSize ) {
        int height = std::min( tileSize, fits.naxis2 - y);
        for( int x = 0 ; x < fits.naxis1 ; x += tileSize ) {
            int width = std::min( tileSize, fits.naxis1 - x);
            cerr << "Tile " << y << "-" << x << " is " << width << "x" << height << "\n";
            DoubleFile tile( QString( "tile-%1-%2.js").arg(x/tileSize).arg(y/tileSize));
            tile    << "(function(){\n"
                    << "var n = Number.NaN;\n"
                    << "return { \n"
                    << "row: " << x/tileSize << ", col: " << y/tileSize << ",\n"
                    << "width: " << width << ", " << " height: " << height << ",\n"
                    << "x: " << x << ", " << " y: " << y << ",\n"
                    << "data:\n"
                    << "[\n";
            for( int yy = y ; yy < y + height ; yy ++ ) {
                for( int xx = x ; xx < x + width ; xx ++ ) {
                    double val = src(xx,yy,frame);
                    if( isfinite(val))
                        tile << val;
                    else
                        tile << "n";
                    if( xx != x + width - 1 || yy != y + height - 1)
                        tile << ",";
                }
                tile << "\n";
            }
            tile << "]\n";
            tile << "};\n"
                 << "})();\n"
                 << "// END\n";
        }
    }

//    reportMemUsage( "After tiles created.");
//
//    bool res = PngFileCompressor::compress( "tile-0-0.js", "tile-0-0.js.png");

    reportMemUsage( "About to exit.");

    return;

    /*
    Chunk chunk( ".");
    chunk.next();
    for( int sy = fits.naxis2 - 1 ; sy >= 0 ; sy -- ) {
        chunk << QString( "a[%1]=[").arg( fits.naxis2 - sy - 1);
        for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
//            double val = frameData(sx,sy);
        	double val = src(sx,sy,frame);
            if( isfinite(val))
                chunk << val;
            else
                chunk << "n";
            if( sx != fits.naxis1 -1) chunk << ",";
        }
        chunk << "];\n";
    }

    // last chunk - cleanup
//    chunk.next();
    chunk << "delete a;\n";
    chunk.close();
*/

/*
    // write as png image
    if(0){
        QString outputFname = tmpDirName + "/data32-png.png";
        QImage img( fits.naxis1, fits.naxis2, QImage::Format_ARGB32);
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
            	float val = frameData(sx,sy); // convert to float
            	uint * valPtr = (uint *) (& val); // get a pointer to the float
            	uint iVal = * valPtr; // convert to uint
                img.setPixel( sx, sy, iVal);
            }
        }
        img.save( outputFname, "png", 0);
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

    // write as png image with 64bits
    if(0){
        QString outputFname = tmpDirName + "/data64-png.png";
        QImage img( fits.naxis1 * 2, fits.naxis2, QImage::Format_ARGB32);
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
            	double val = frameData(sx,sy);
            	uint * valPtr = (uint *) (& val);
                img.setPixel( sx*2+0, sy, valPtr[0]);
                img.setPixel( sx*2+1, sy, valPtr[1]);
            }
        }
        img.save( outputFname, "png", 0);
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }
*/

    /*
    out << "globals.minValue = " << min << ";\n";
    out << "globals.maxValue = " << max << ";\n";
    out << "globals.naxis = " << fits.naxis << ";\n";
    out << "globals.naxis1 = " << fits.naxis1 << ";\n";
    out << "globals.naxis2 = " << fits.naxis2 << ";\n";
    out << "globals.naxis3 = " << fits.naxis3 << ";\n";
    out << "globals.crval1 = " << fits.crval1 << ";\n";
    out << "globals.crval2 = " << fits.crval2 << ";\n";
    out << "globals.crpix1 = " << fits.crpix1 << ";\n";
    out << "globals.crpix2 = " << fits.crpix2 << ";\n";
    out << "globals.cdelt1 = " << fits.cdelt1 << ";\n";
    out << "globals.cdelt2 = " << fits.cdelt2 << ";\n";
    out << "globals.ctype1 = " << fitsString2js( fits.ctype1) << ";\n";
    out << "globals.ctype2 = " << fitsString2js( fits.ctype2) << ";\n";
    out << "globals.equinox = " << fits.equinox << ";\n";
    out << "globals.bunit = " << fitsString2js( fits.bunit) << ";\n";
    out << "globals.fname = '" << fitsIn << "';\n";
    out << "globals.frame = " << frame << ";\n";
    out << "globals.floatImage = [];\n";
    size_t maxChunk = 20000;
    std::vector< double > chunk;
    chunk.reserve( maxChunk);
    struct anon {
        static void spit( const std::vector<double> & chunk, QTextStream & out) {
            //                std::cerr << "spit chunk " << chunk.size() << "\n";
            out << "globals.floatImage = globals.floatImage.concat([\n";
            for( size_t i = 0 ; i < chunk.size() ; i ++ ) {
                if( i) out << ",";
                if( (i+1) % 8 == 0) out << "\n";
                if( isfinite( chunk[i]))
                    out << chunk[i];
                else
                    out << "n";
            }
            out << "]);\n";
        }
    };

    for( int sy = fits.naxis2 - 1 ; sy >= 0 ; sy -- ) {
        for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
            double val = frameData(sx,sy);
            chunk.push_back( val);
            if( chunk.size() == maxChunk) {
                anon::spit( chunk, out);
                chunk.resize(0);
                chunk.reserve( maxChunk);
            }
        }
    }
    if( chunk.size())
        anon::spit( chunk, out);
    out << " } catch (err) {\n";
    out << " globals.error = err;\n";
    out << "}\n";


    // make sure all info is written out
    output.close();

    std::cout << "Wrote " << output.fileName().toStdString() << "\n";
    // now perform the move
    if( QFile::rename( output.fileName(), outputFileName)) {
        std::cerr << "Successfuly moved the file to " << outputFileName.toStdString() << "\n";
        output.setAutoRemove( false); // no need to try to remove the file now that we have moved it
        return;
    } else {
        throw "Could not rename the file.";
    }
*/


/*
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;
    return;

    // write as compressed text
    {
        QString outputFname = "data-text-zipped.txt";
        QFile output( outputFname);
        if( ! output.open( QFile::WriteOnly | QFile::Truncate ))
            throw QString( "Could not open file '%1' for writing.").arg( outputFname);
        QString buff;
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
                buff += QString( "%1\n").arg(frameData(sx,sy));
            }
        }
        QTextStream out( & output);
        QByteArray ba( buff.toAscii());
        ba = qCompress( ba, 9);
        blockWrite( output, ba.constData(), ba.size());
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

    // write as binary
    {
        QString outputFname = "data-ieee-floats.data";
        QFile output( outputFname);
        if( ! output.open( QFile::WriteOnly | QFile::Truncate ))
            throw QString( "Could not open file '%1' for writing.").arg( outputFname);
        blockWrite( output, frameData.raw(), fits.naxis1 * fits.naxis2 * 4);
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

    // write as base64 string
    {
        QString outputFname = "data-base64.txt";
        QFile output( outputFname);
        if( ! output.open( QFile::WriteOnly | QFile::Truncate ))
            throw QString( "Could not open file '%1' for writing.").arg( outputFname);
        QTextStream out( & output);
        QByteArray buff( frameData.raw(), fits.naxis1 * fits.naxis2 * 4);
        out << buff.toBase64() << "\n";
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

    // write as compressed-base64 string
    {
        QString outputFname = "data-compressed-base64.txt";
        QFile output( outputFname);
        if( ! output.open( QFile::WriteOnly | QFile::Truncate ))
            throw QString( "Could not open file '%1' for writing.").arg( outputFname);
        QTextStream out( & output);
        QByteArray buff( frameData.raw(), fits.naxis1 * fits.naxis2 * 4);
        buff = qCompress( buff, 9);
        out << buff.toBase64() << "\n";
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

    // write as png image
    {
        QString outputFname = "data-png.png";
        QImage img( fits.naxis1, fits.naxis2, QImage::Format_ARGB32);
        for( int sy = 0 ; sy < fits.naxis2 ; sy ++ ) {
            for( int sx = 0 ; sx < fits.naxis1 ; sx ++ ) {
                img.setPixel( sx, sy, * ((uint*) (& frameData(sx,sy))));
            }
        }
        img.save( outputFname, "png", 0);
        std::cout << "Wrote " << outputFname.toStdString() << "\n";
    }

*/
}
