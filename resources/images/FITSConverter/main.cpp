#include <cstdlib>
#include <iostream>
#include <QtCore/QCoreApplication>
#include <QSettings>
#include <QFileInfo>
#include <QDir>
#include <QImage>
#include <QString>
#include <QStringList>
#include <QFile>
#include <QTextStream>
#include <QTime>

#include "extractor.h"

using namespace std;

static void usage( int argc, char ** argv )
{
    QString err;
    QTextStream out( & err);
    out << "Usage error. Arguments used:\n";
    for( int i = 1 ; i < argc ; i ++ )
        out << "  " << i << " '" << argv[i] << "'\n";
    out << "Correct usage is:\n";
    out << "  " << argv[0] << " fitsfile frame# tileSize\n";
    throw err;
}

int main( int argc, char ** argv)
{

    cerr << "Invoked as: |";
    for( int i = 0 ; i < argc ; i ++ )
        cerr << argv[i] << "|";
    cerr << "\n";

    QCoreApplication app(argc, argv);

    // initialize random number generator
    qsrand(QTime(0,0,0).msecsTo(QTime::currentTime()));

    QStringList errors;
    bool success = false;
    try {
        // get the command line arguments
        if( argc != 4 ) {
            usage( argc, argv);
        }
        QString fitsFileName = argv[1];
        bool ok;
        int frame = QString( argv[2]).toInt( & ok );
        if( ! ok || frame < 0) {
            usage( argc, argv);
        }
        int tileSize = QString( argv[3]).toInt( & ok );
        if( ! ok || ! (tileSize > 0)) {
            usage( argc, argv);
        }

        //        // change current directory to the output directory
//        if( ! QDir::setCurrent( outputDir))
//            throw "Could not chdir to the output directory.";
        extractFitsFrame( fitsFileName, frame, tileSize );
        success = true;
    } catch ( const char * msg) {
        errors << "Exception occured: " << msg;
    } catch ( const QString & msg) {
        errors << "Exception occured: " << msg;
    } catch ( std::exception & e) {
        errors << "Exception occured: " << e.what();
    } catch ( ... ) {
        errors << "Unknown exception occured";
    }
    // if there was an error, indicate so in errors.txt file
    if( ! success) {
        QFile fp( "errors.txt");
        if( fp.open(QFile::WriteOnly)) {
            QTextStream out( & fp);
            out << errors.join("\n") << "\n";
            fp.close();
        }
        cerr << errors.join("\n").toStdString() << "\n";
    }
//    // mark this cache as done
//    QFile fp("done");
//    if( fp.open(QFile::WriteOnly)) fp.close();
//    // delete the lock
//    QFile::remove( "lock");
    return 0;
}
