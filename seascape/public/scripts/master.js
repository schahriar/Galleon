var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

// Initialize jQuery in BackBone
Backbone.$ = $;

var unknown = "unknown", fail = no = false, pass = yes = true, empty = "";

var client = new Object;

client.build = function(){
	var Model = Backbone.Model.extend({
		urlRoot: '/api',
		idAttribute: 'eID',
		
		// Default attributes
		defaults: function() {
			return {
				eID: undefined,
				from: { name:unknown, email:unknown },
				to: new Array,
				subject: unknown,
				
				text: empty,
				html: unknown,
				
				stamp: undefined
			};
		},

		initialize: function() {
			
		},

		store: function() {
			this.save();
		},
		
		setRead: function() {
			this.set('read', true);
		}

	});
	
	var Collection = Backbone.Collection.extend({
		url: '/api',

		// Reference to this collection's model.
		model: Model,
		
		initialize: function(){
			//this.model.on('sync', this.onSync);
			//this.model.on('error', this.onError);
			//this.model.on('destroy', this.onDestroy);
		},

		// Filter down the list of all unread emails.
		read: function(eID) {
			return this.model.setRead();
		}
	});

	var Item = Backbone.View.extend({
		el: 'section#list',
		tagName:  "article",

		template: _.template('<article class="item"><header><%- subject %></header></article>'),

		// The DOM events specific to an item.
		events: {
			"click .item"   : "toggleDone"
		},

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			this.$(el).append(this.template(this.model.toJSON()));
			return this;
		}

	});
	
	this.Model = Model;
	this.Mail = new Collection;
	this.Item = Item;
}

$(function(){ window.API = new client.build(); })