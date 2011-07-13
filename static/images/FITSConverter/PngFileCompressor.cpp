#include <iostream>
#include <cmath>

#include <QImage>
#include <QFile>

#include "PngFileCompressor.h"

using namespace std;

PngFileCompressor::PngFileCompressor()
{
}

static QSize calculateBestImageSize( qint64 s)
{
    int w = int( sqrt( s/4));
    int h = w;
    if( w*h*4 < s) w ++;
    if( w*h*4 < s) h ++;

    if( w*h*4 < s) throw "calculateBestImageSize() something is wrong";
    return QSize( w, h);
}

struct ImageBuffer {
    ImageBuffer( QImage & img) : _img( img) { x=0; y=0; nBuff = 0; };
    void appendByte( quint8 b) {
        if( y >= _img.height()) throw "ImageBuffer::appendByte() out of bounds";
        buff[ nBuff ++] = b;
        if( nBuff == 4) flushBuffer();
    }
    void append( qint64 num) {
        quint8 * ptr = (quint8 *) & num;
        for( uint i = 0 ; i < sizeof(qint64) ; i ++ )
            appendByte( ptr[i]);
    }
    void flushBuffer() {
        if( nBuff == 0) return;
        for( int i = nBuff ; i < 4 ; i ++ ) buff[i] = 0;
        _img.setPixel( x, y, qRgba( buff[0], buff[1], buff[2], buff[3]));
        x ++; if( x >= _img.width()) { x = 0; y ++; }
        nBuff = 0;
    }

    QImage & _img;
    int x, y;
    quint8 buff[4];
    int nBuff;
};

bool PngFileCompressor::compress(const QString &inFname, const QString &outFname)
{
    QFile inp( inFname);
    if( ! inp.open( QFile::ReadOnly)) {
        cerr << "PngFileCompressor::compress(): Could not open file " << inFname.toStdString() << "\n";
        return 0;
    }

    // determine the necessary size of the image: 8 + filesize
    // 8 bytes are needed to encode the length of the file (64 bits)
    qint64 fsize = inp.size();
    cerr << "File size = " << fsize << " bytes\n";
    QSize size = calculateBestImageSize( fsize + 8);
    cerr << "Best image size = " << size.width() << "x" << size.height() << "\n";

    QImage img( size, QImage::Format_ARGB32);
    if( img.isNull()) throw "PngFileCompressor::compress() failed to allocate image.";
    ImageBuffer imgb( img);
    imgb.append( fsize);
    // now read in the file and save it
    quint8 buff[4096];
    while( true) {
        qint64 nread = inp.read( (char*) buff, sizeof( buff));
        if( nread <= 0) break;
        for( int i = 0 ; i < nread ; i ++ )
            imgb.appendByte( buff[i]);
    }


    imgb.flushBuffer();
    if( ! img.save( outFname + ".tmp", "PNG", 100))
        throw "PngFileCompressor::compress() could not save output image";
    if( ! QFile::rename( outFname + ".tmp", outFname))
        throw "PngFileCompressor::compress() could not save output image (rename failed)";

    return true;
}
