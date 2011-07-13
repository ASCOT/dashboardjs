# -------------------------------------------------
# Project created by QtCreator 2010-06-01T04:00:19
# -------------------------------------------------
# QT -= gui
CONFIG -= debug
CONFIG += release
TARGET = extractFitsFrame
CONFIG += console
CONFIG -= app_bundle
TEMPLATE = app
SOURCES += main.cpp \
    extractor.cpp \
    DoubleFile.cpp \
    PngFileCompressor.cpp
RESOURCES += 
HEADERS += extractor.h \
    DoubleFile.h \
    PngFileCompressor.h
DEPENDPATH = .
OTHER_FILES += readme.txt
