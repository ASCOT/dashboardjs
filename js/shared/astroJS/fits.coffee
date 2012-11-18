define ['cs!/astroJS/fits.hdu', 'cs!/astroJS/fits.file', 'cs!/astroJS/fits.header', 'cs!/astroJS/fits.image', 'cs!/astroJS/fits.binarytable', 'cs!/astroJS/fits.compressedimage', 'cs!/astroJS/fits.table'], (hdu, file, header, image, binarytable, compressedimage, table) ->
	return (
		VERSION:     '0.1.0'
		HDU:         hdu
		File:        file
		Header:      header
		Image:       image
		BinTable:    binarytable
		CompImage:   compressedimage
		Table:       table)
