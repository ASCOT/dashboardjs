#include "DoubleFile.h"

#include <iostream>
#include <QString>
#include <QFile>
#include <QTextStream>

DoubleFile::DoubleFile( const QString & fname) {
    _stream = 0;
    _fp = 0;
    _fname = fname;
    _tmpFname = fname + ".tmp";
    std::cerr << "Double file: opening " << _tmpFname.toStdString() << "\n";
    _fp = new QFile( _tmpFname);
    if( ! _fp-> open( QFile::WriteOnly | QFile::Truncate))
        throw QString( "Could not open %1 for writing").arg( _fname);
    _stream = new QTextStream( _fp);
}
void DoubleFile::close() {
    if( ! _fp) return;
    _stream-> flush(); delete _stream; _stream = 0;
    _fp->close(); delete _fp; _fp = 0;
    if( ! QFile::rename( _tmpFname, _fname))
        throw QString("DoubleFile: failed to rename %1 to %2").arg(_tmpFname).arg(_fname);
}

DoubleFile::~DoubleFile() {
    close();
}

