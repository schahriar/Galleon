var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var moment = require('moment');

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
				excerpt: empty,
				html: unknown,
				
				stamp: undefined
			};
		},

		initialize: function() {
			this.createExcerpt();
		},

		store: function() {
			this.save();
		},
		
		setRead: function() {
			this.set('read', true);
		},
		
		createExcerpt: function() {
			var text = this.get('text');
			var excerpt = text.substring(0, 200);
			
			if(text!=excerpt) excerpt += "...";
			this.set('excerpt', excerpt);
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

	var ItemView = Backbone.View.extend({
		tagName:  "article",

		template: _.template(
			'<header>'
				+'<img class="image" src="http://placehold.it/64x64"/>'
				+'<div class="email"><%- sender %></div>'
				+'<div class="subject"><%- subject %></div>'
				+'<div class="date"></div>'
				+'<div class="excerpt"><%- excerpt %></div>'
			+'</header>'),

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	var MailView = Backbone.View.extend({
		tagName:  "section",

		template: _.template(
			'<header class="pure-g">'
				+'<h2><%- subject %></h2>'
				+'<div class="pure-u-4-5">From <%- sender %> to <span>You</span></div>'
				+'<div class="pure-u-1-5 date"></div>'
			+'</header>'
			+'<section>'
				+'<div class="html"></div>'
				+'<div class="reply></div>'
			+'</section>'),

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			//class="mail" data-eid="<%- sender %>">
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	var Mail = new Collection;
	
	var View = Backbone.View.extend({
		el: $("section#list"),
		view: $("#view"),
		
		// The DOM events specific to an item.
		events: {
			"click article"   : "load"
		},

		initialize: function() {
			this.listenTo(Mail, 'all', this.render);
			
			Mail.fetch();
		},
		
		addOne: function(mail) {
			// Refresh element
			this.el = $("section#list");
			
			var view = new ItemView({model: mail});

			if(!this.el.find('[data-eid="' + mail.get('eID') + '"]').length){
				var newElement = $(view.render().el);
				newElement.attr('data-eid',mail.get('eID'));
				
				// Add better date parsing
				newElement.find('.date').text(moment(mail.get('stamp').sent).startOf('day').fromNow());
				
				this.el.append(newElement);
			}
		},
		
		addAll: function() {
		  Mail.each(this.addOne, this);
		},
		
		load: function(e) {
			// Refresh elements
			this.el = $("section#list");
			this.view = $("#view");
			
			var element = $(e.currentTarget);

			var mail = Mail.findWhere({ 'eID': element.attr('data-eid') });
			
			if(!mail) console.warn("No EMAIL found!");
			var view = new MailView({model: mail});
			
			var newElement = $(view.render().el);
			newElement.attr('data-eid',mail.get('eID'));

			// Add better date parsing
			newElement.find('.date').text(moment(mail.get('stamp').sent).startOf('day').fromNow());

			this.view.html(newElement);
		},

		render: function() {
			this.addAll();
		}

	});
	
	this.Model = Model;
	this.Mail = Mail;
	this.ItemView = ItemView;
	this.View = new View;
}

$(function(){ window.API = new client.build(); })