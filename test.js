var Galleon = require("./Galleon");

var g = new Galleon({});
g.on("ready", function() { 
	g.server();
});

/*g.on("ready", function() {
	g.dispatch({
		from: "galleon@schahriar.com",
		to: "info@schahriar.com",
		subject: "A test message",
		html: "Hello World! <b>" + Math.random() + "</b>"
	})
});*/
