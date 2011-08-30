#ifndef PNGFILECOMPRESSOR_H
#define PNGFILECOMPRESSOR_H

#include <QString>

class PngFileCompressor
{
public:
    PngFileCompressor();

    static bool compress( const QString & inFname, const QString & outFname);
};

#endif // PNGFILECOMPRESSOR_H
