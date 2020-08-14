# Loupedeck CT
### Unofficial node.js library
Here are the results of our ongoing reverse engineering of the Loupedeck CT communication protocol. 

### Install
`yarn add https://github.com/bitfocus/loupedeck-ct.git`

### Why?
* When we started doing this, there was no official SDK for the Loupedeck CT available (there is now)
* Linux support
* Communicate directly without "third (first?) parties" involved
* Because we can ;)

### What works
* Large display - graphics (the large button grid display)
* Large display - touch events (multi touch)
* Small display - graphics (the one on the large encoder)
* Small display - touch events (single touch)

### Todo
* Display intensity
* Vibrations
* Make a ready to use npm module
* Tests?

### Author
Bitfocus AS
* William Viker <william@bitfocus.io>
* Håkon Nessjøen <haakon@bitfocus.io>
