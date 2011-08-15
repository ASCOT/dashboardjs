<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <xsl:apply-templates/>
</xsl:template>
<xsl:template select="ascot">  
  <button id="lsstButton" class="ascot shuttle">
    <xsl:attribute name="dashboard"></xsl:attribute>
    <xsl:attribute name="dataSets"></xsl:attribute>
    <xsl:attribute name="onClick"></xsl:attribute>
    <div class="clickedButtonState" style="display: none">
      <div class="spinner"> 
        <div class="bar1"></div> 
        <div class="bar2"></div> 
        <div class="bar3"></div> 
        <div class="bar4"></div> 
        <div class="bar5"></div> 
        <div class="bar6"></div> 
        <div class="bar7"></div> 
        <div class="bar8"></div> 
      </div> 
    </div>
  </button>
</xsl:template>
</xsl:stylesheet>