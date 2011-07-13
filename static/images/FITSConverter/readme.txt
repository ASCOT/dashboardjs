readme.txt for the frame extractor

The frame extractor can extract a single frame from a FITS file with naxis > 1.

Number of frames in a fits file is 1 * product( NAXISi for i>2).
    Example1: a 2D file (NAXIS=2) has 1 frame.
    Example2: a 4D file with NAXIS=4, NAXIS3=1, NAXIS4=1 has 1 frame
    Example3: a 5D file with NAXIS=5, NAXIS3=1, NAXIS4=5, NAXIS5=1 has 5 frames

Input to the program:

    - FITS filename
    - frame number
    - tile size (size x size pixels)

Errors:
    - if there were any fatal errors, a file called 'errors.txt' will be created in the destination
      directory containing some descriptive error message. This message can be presented to
      the user (it should contain no information that could compromise security).
    - additional debugging information can is spewed out to stderr

Output:
    - the FITS file is extracted into a header, thumbnail and tiles containing data
    - the header is stored in 'header.js' and containes some parsed information about
      the FITS file
    - the thumbnail is called 'thumb.jpg' and is a scaled down version of the FITS frame
      rendered using 99.5% auto histram correction and grey-level map
    - the data tiles are
    - the output, once present in a directory, can be assumed it is complete

