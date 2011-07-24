#pragma once

#include <QString>
#include <QTextStream>
#include <QFile>

class DoubleFile
{
public:
    DoubleFile( const QString & fname);
    void close();
    ~DoubleFile();

    QTextStream * _stream;

private:
    QString _fname, _tmpFname;
    QFile * _fp;
};


// this has to be sitting outside if we want to use full template specialization, as gcc
// does not allow template specialization of a method only... wth
template <typename T>
inline DoubleFile & operator << ( DoubleFile & df, const T & val) {
    if( ! df._stream)
        throw "Internal error. Trying to write to a closed double file.";
    ( * df._stream) << val;
    return df;
}

// special case for doubles
inline DoubleFile & operator << ( DoubleFile & df, const double & val) {
    if( ! df._stream)
        throw "Internal error. Trying to write to a closed double file.";
    ( * df._stream) << val ;

    return df;
}
