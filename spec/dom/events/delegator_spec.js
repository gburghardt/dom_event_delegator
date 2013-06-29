describe("dom.events.Delegator", function() {

	beforeEach(function() {
		this.delegate = {};
		this.node = document.createElement("div");
		this.delegator = new dom.events.Delegator(this.delegate, this.node);
	});

	describe("getMethodFromAction", function() {

		it("returns the action when there is no action prefix", function() {
			expect(this.delegator.actionPrefix).toBeNull();
			expect(this.delegator.getMethodFromAction("testing")).toEqual("testing");
			expect(this.delegator.getMethodFromAction("foo.bar.baz")).toEqual("foo.bar.baz");
		});

		it("returns null when the action prefix does not match", function() {
			this.delegator.setActionPrefix("foo.bar");
			expect(this.delegator.getMethodFromAction("baz.testing")).toBeNull();
			expect(this.delegator.getMethodFromAction("foo.bar.baz.testing")).toBeNull();
		});

		it("returns the method name when the action prefix matches", function() {
			this.delegator.setActionPrefix("foo.bar");
			expect(this.delegator.getMethodFromAction("foo.bar.testing")).toEqual("testing");
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
				click: "foo",
				mouseover: "bar"
			};

			this.delegator.setEventActionMapping(mapping);
			expect(this.delegator.addEventType).wasCalledWith("click");
			expect(this.delegator.addEventType).wasCalledWith("mouseover");
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

	describe("handleEvent", function() {
		xit("should be tested");
	});

});
