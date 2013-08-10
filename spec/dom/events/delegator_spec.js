describe("dom.events.Delegator", function() {

	function MockEvent(type) {
		this.type = type;
	}

	MockEvent.prototype = {
		dispatchEvent: function(target) {
			this.target = target;
			this.currentTarget = target;
		},
		stopPropagation: function() {

		},
		preventDefault: function() {
			
		}
	};

	beforeEach(function() {
		this.delegate = {};
		this.node = document.createElement("div");
		this.delegator = new dom.events.Delegator(this.delegate, this.node);
	});

	describe("getMethodFromAction", function() {

		it("returns the action when there is no action prefix", function() {
			expect(this.delegator.actionPrefix).toBeNull();
			expect(this.delegator.getMethodFromAction("testing", "testing")).toEqual("testing");
			expect(this.delegator.getMethodFromAction("foo.bar.baz", "baz")).toEqual("baz");
		});

		it("returns null when the action prefix does not match", function() {
			this.delegator.setActionPrefix("foo.bar");
			expect(this.delegator.getMethodFromAction("baz.testing", "testing")).toBeNull();
			expect(this.delegator.getMethodFromAction("foo.bar.baz.testing", "testing")).toBeNull();
		});

		it("returns the method name when the action prefix matches", function() {
			this.delegator.setActionPrefix("foo.bar");
			expect(this.delegator.getMethodFromAction("foo.bar.testing", "testing")).toEqual("testing");
		});

	});

	describe("setActionPrefix", function() {

		it("sets the action prefix", function() {
			this.delegator.setActionPrefix("foo.bar.");
			expect(this.delegator.actionPrefix).toEqual("foo.bar.");
		});

		it("appends a '.' character to the end of one does not exist", function() {
			this.delegator.setActionPrefix("foo");
			expect(this.delegator.actionPrefix).toEqual("foo.");
		});

	});

	describe("setEventActionMapping", function() {

		beforeEach(function() {
			spyOn(this.delegator, "addEventType");
			spyOn(this.delegator, "removeEventType");
		});

		it("sets a new mapping of actions to events", function() {
			var mapping = {
				click: ["foo", "baz"],
				mouseover: "bar"
			};

			this.delegator.setEventActionMapping(mapping);
			
			expect(this.delegator.addEventType).wasCalledWith("click");
			expect(this.delegator.addEventType).wasCalledWith("mouseover");

			expect(this.delegator.eventActionMapping.click).toEqual(["foo", "baz"]);
			expect(this.delegator.eventActionMapping.mouseover).toEqual(["bar"]);

			expect(this.delegator.actionEventMapping.foo).toEqual("click");
			expect(this.delegator.actionEventMapping.baz).toEqual("click");
			expect(this.delegator.actionEventMapping.bar).toEqual("mouseover");
		});

		it("unregisters event handlers from the old mapping when registering a new mapping", function() {
			this.delegator.setEventActionMapping({click: "foo", focus: "bar"});

			expect(this.delegator.addEventType).wasCalledWith("click");
			expect(this.delegator.addEventType).wasCalledWith("focus");
			expect(this.delegator.removeEventType).wasNotCalled();

			this.delegator.setEventActionMapping({blur: "test", keypress: "blah"});

			expect(this.delegator.removeEventType).wasCalledWith("click");
			expect(this.delegator.removeEventType).wasCalledWith("focus");

			expect(this.delegator.addEventType).wasCalledWith("blur");
			expect(this.delegator.addEventType).wasCalledWith("keypress");
		});
	});

	describe("handlePatchedEvent", function() {
		
		beforeEach(function() {
			this.event = new MockEvent("click");
			this.event.dispatchEvent(this.node);
		});

		it("passes the event, acton element, params and action name to the delegate", function() {
			var test = this;

			this.node.innerHTML = [
				'<div>',
					'<p>',
						'<button type="button" data-action="test">Save</button>',
					'</p>',
				'</div>'
			].join("");

			var targetElement = this.node.getElementsByTagName("button")[0];

			this.delegate.test = function(event, element, params, action) {
				expect(this).toStrictlyEqual(test.delegate);
				expect(event).toStrictlyEqual(test.event);
				expect(element).toStrictlyEqual(targetElement);
				expect(params).toEqual({});
				expect(action).toEqual("test");
			};

			spyOn(this.delegate, "test").andCallThrough();

			this.event.dispatchEvent(targetElement);
			
			this.delegator.handlePatchedEvent(this.event, targetElement);
			expect(this.delegate.test).wasCalledWith(this.event, targetElement, {}, "test");
		});

		describe("without an event-to-action mapping", function() {

			describe("and no action prefix", function() {

				it("calls a method on the delegate from the data-action attribute", function() {
					var test = this;

					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action="test">Save</button>',
							'</p>',
						'</div>'
					].join("");

					var targetElement = this.node.getElementsByTagName("button")[0];

					this.delegate.test = function() {};
					spyOn(this.delegate, "test");
					this.event.dispatchEvent(targetElement);
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.test).wasCalledWith(this.event, targetElement, {}, "test");
				});

				it("calls a method on the delegate from the data-action-EVENT_TYPE attribute", function() {
					var test = this;

					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action-click="test">Save</button>',
							'</p>',
						'</div>'
					].join("");

					var targetElement = this.node.getElementsByTagName("button")[0];

					this.delegate.test = function() {};
					spyOn(this.delegate, "test");

					this.delegator.handlePatchedEvent(this.event, targetElement);
					expect(this.delegate.test).wasCalledWith(this.event, targetElement, {}, "test");
				});

				it("calls a method on the delegate for every event from the data-action attribute", function() {
					var test = this;

					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action="test">Save</button>',
							'</p>',
						'</div>'
					].join("");

					var targetElement = this.node.getElementsByTagName("button")[0];

					var callCount = 0;

					this.delegate.test = function() {
						callCount++;
					};

					spyOn(this.delegate, "test").andCallThrough();

					this.event.dispatchEvent(targetElement);
					
					this.delegator.handlePatchedEvent(this.event, targetElement);

					this.event.type = "mouseup";
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(callCount).toEqual(2);
				});

				it("does not call the method specified in data-action when a data-action-EVENT_TYPE attribute exists", function() {
					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action="doNotCallMe" data-action-click="callMe">Save</button>',
							'</p>',
						'</div>'
					].join("");

					this.delegate.doNotCallMe = function() {};
					this.delegate.callMe = function() {};

					spyOn(this.delegate, "doNotCallMe");
					spyOn(this.delegate, "callMe");

					var targetElement = this.node.getElementsByTagName("button")[0];
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.doNotCallMe).wasNotCalled();
					expect(this.delegate.callMe).wasCalledWith(this.event, targetElement, {}, "callMe");
				});

				it("calls handleAction by default if that method exists on the delegate", function() {
					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action="test">Save</button>',
							'</p>',
						'</div>'
					].join("");

					this.delegate.handleAction = function() {};
					spyOn(this.delegate, "handleAction");
					var targetElement = this.node.getElementsByTagName("button")[0];
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.handleAction).wasCalledWith(this.event, targetElement, {}, "test");
				});

				it("does not call handleAction if that method does not exist on the delegate", function() {
					this.node.innerHTML = [
						'<div>',
							'<p>',
								'<button type="button" data-action="test">Save</button>',
							'</p>',
						'</div>'
					].join("");

					var targetElement = this.node.getElementsByTagName("button")[0];
					this.delegator.handlePatchedEvent(this.event, targetElement);
				});

			});

			describe("and an action prefix", function() {

				beforeEach(function() {
					this.delegator.setActionPrefix("blogPost");
				});

				describe("when the action prefix matches", function() {

					it("calls a method on the delegate from the data-action attribute", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action="blogPost.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.view = function() {};
						spyOn(this.delegate, "view");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasCalledWith(this.event, targetElement, {}, "view");
					});

					it("calls a method on the delegate from the data-action-EVENT_TYPE attribute", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action-click="blogPost.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.view = function() {};
						spyOn(this.delegate, "view");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasCalledWith(this.event, targetElement, {}, "view");
					});

					it("calls handleAction on the delegate if the method does not exist", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action-click="blogPost.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.handleAction = function() {};
						spyOn(this.delegate, "handleAction");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.handleAction).wasCalledWith(this.event, targetElement, {}, "view");
					});

				});

				describe("when the action prefix does not match", function() {

					it("does not call a method on the delegate from the data-action attribute", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action="wrongPrefix.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.view = function() {};
						spyOn(this.delegate, "view");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasNotCalled();
					});

					it("does not call a method on the delegate from the data-action-EVENT_TYPE attribute", function(){
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action-click="wrongPrefix.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.view = function() {};
						spyOn(this.delegate, "view");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasNotCalled();
					});

					it("does not call handleAction even if the method exists on the delegate", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action-click="wrongPrefix.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];

						this.delegate.handleAction = function() {};
						spyOn(this.delegate, "handleAction");
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.handleAction).wasNotCalled();

					});

				});

			});

		});

		describe("with an event-to-action mapping", function() {
			beforeEach(function() {
				this.mapping = {
					click: ["view", "save", "cancel"],
					keypress: "autoComplete"
				};

				// this.delegate.cancel omitted on purpose
				this.delegate.view = function() {};
				this.delegate.save = function() {};
				this.delegate.autoComplete = function() {};
				this.delegate.handleAction = function() {};

				spyOn(this.delegate, "view");
				spyOn(this.delegate, "save");
				spyOn(this.delegate, "autoComplete");
				spyOn(this.delegate, "handleAction");

				this.delegator.setEventActionMapping(this.mapping);
			});

			describe("and no action prefix", function() {

				it("calls a method on the delegate when the event type matches the mapping", function() {
					this.node.innerHTML = [
						'<li>',
							'<a href="#" data-action="view">Full Post</a>',
						'</li>'
					].join("");

					var targetElement = this.node.getElementsByTagName("a")[0];
					this.event.dispatchEvent(targetElement);
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.view).wasCalledWith(this.event, targetElement, {}, "view");
					expect(this.delegate.handleAction).wasNotCalled();
				});

				it("does not call a method on the delegate when the event type doesn't match the mapping", function() {
					this.event.type = "mousedown";
					this.node.innerHTML = [
						'<li>',
							'<a href="#" data-action="view">Full Post</a>',
						'</li>'
					].join("");

					var targetElement = this.node.getElementsByTagName("a")[0];
					this.event.dispatchEvent(targetElement);
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.view).wasNotCalled();
					expect(this.delegate.handleAction).wasNotCalled();
				});

				it("calls handleAction when the event type has been subscribed to, but no method matches the action", function() {
					this.node.innerHTML = [
						'<p>',
							'<button type="button" data-action="cancel">Cancel</button>',
						'</p>'
					].join("");

					var targetElement = this.node.getElementsByTagName("button")[0];
					this.event.dispatchEvent(targetElement);
					this.delegator.handlePatchedEvent(this.event, targetElement);

					expect(this.delegate.view).wasNotCalled();
					expect(this.delegate.handleAction).wasCalledWith(this.event, targetElement, {}, "cancel");
				});

			});

			describe("and an action prefix", function() {

				beforeEach(function() {
					this.delegator.setActionPrefix("blogPost");
				});

				describe("when the action prefix matches", function() {

					it("calls a method on the delegate if a mapping exists", function() {
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action="blogPost.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasCalledWith(this.event, targetElement, {}, "view");
						expect(this.delegate.handleAction).wasNotCalled();
					});

					it("does not call a method on the delegate if the mapping does not exist", function() {
						this.event.type = "mousedown";
						this.node.innerHTML = [
							'<li>',
								'<a href="#" data-action="blogPost.view">Full Post</a>',
							'</li>'
						].join("");

						var targetElement = this.node.getElementsByTagName("a")[0];
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasNotCalled();
						expect(this.delegate.handleAction).wasNotCalled();
					});

					it("calls handleAction if that method exists and the mapping does not exist", function() {
						this.node.innerHTML = [
							'<p>',
								'<button type="button" data-action="blogPost.cancel">Cancel</button>',
							'</p>'
						].join("");

						var targetElement = this.node.getElementsByTagName("button")[0];
						this.event.dispatchEvent(targetElement);
						this.delegator.handlePatchedEvent(this.event, targetElement);

						expect(this.delegate.view).wasNotCalled();
						expect(this.delegate.handleAction).wasCalledWith(this.event, targetElement, {}, "cancel");
					});

				});

				describe("when the action prefix does not match", function() {

					xit("does not call a method on the delegate if the mapping exists");

					xit("does not call handleAction if the method exists");

				});

			});

		});

		xit("calls multiple methods on the delegate if the event propagation is not stopped");

		xit("does not continue calling methods on the delegate if the propagation is stopped");

	});

	describe("handleActionError", function() {
		xit("should be tested");
	});

});
