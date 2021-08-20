#Markdown image sizer

This NodeBB plugin allows you to change the size of a markdown image in a post using the @ character.
The image is updated automatically in the composer preview.

The syntax is:
![alternative text](http://someurl.com/someimage.png@<size>)

You can change the size in three different ways:

Width and height (doesn't keep aspect ratio):
![alternative text](http://someurl.com/someimage.png@1920x1080)

Percentage (keep aspect ratio):
![alternative text](http://someurl.com/someimage.png@50%)

Width only(keep aspect ratio):
![alternative text](http://someurl.com/someimage.png@200)
