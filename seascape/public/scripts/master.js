var Backbone = require('backbone');

var unknown = "unknown", fail = no = false, pass = yes = true, empty = "";

var client = new Object;

client.build = function(){
	var Model = Backbone.Model.extend({
		urlRoot: '/api',
		// Default attributes
		defaults: function() {
			return {
				from: { name:unknown, email:unknown },
				to: new Array,
				subject: unknown,
				text: empty,
				html: unknown
			};
		},

		initialize: function() {
			
		},

		store: function() {
			this.save();
		}

	});
	
	var Collection = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: Mail,

		// Filter down the list of all unread emails.
		unread: function() {
			return this.filter(function(email){ return !email.get('read'); });
		}
	});
	
	this.Model = Model;
	this.Mail = new Collection;

	var MailList = Backbone.View.extend({
		
		tagName:  "article",

		template: _.template($('#mail-item-template').html()),

		// The DOM events specific to an item.
		events: {
			"click .item"   : "toggleDone"
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			return this;
		}

	});
}

$(function(){ var Connection = new client.build(); console.log(Connection); })