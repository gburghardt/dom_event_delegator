# DOM Event Delegator

A simple cross browser event delegation library with low dependencies that allows you to easily map "actions" in custom HTML5 attributes to methods on an object.

## Nostalgic for `onclick`

Remember way back in the Dark Ages of front end development when we used `onclick` attributes with wanton disregard for the consequences? It wasn't the easiest code to maintain, but darn it, it was easy to troubleshoot when something went wrong. Right-click, view source, `onclick="foo(this)"` -- "Yep, that's where things are going wrong. I click the link and nothing happens. Has to be the 'foo' function."

Then along came unobtrusive JavaScript. That was easier to maintain, however there was no clear indication how actions by the user landed on functions or methods in JavaScript. This code was easier to maintain, but harder to troubleshoot. So is it really that easy to maintain?

jQuery helped us out a little. We could attach event handlers to elements using class names, but all to often we tied CSS styles to those class names, mixing style and behavior. This is no better to maintain than our old, humble friend the `onclick`.

## Making HTML5 Cake (So We Can Eat It Too)

The DOM Event Delegator was built with X things in mind:

1) JavaScript remains unobtrusive
2) Separate style from behavior
3) Make it easier to trouble shoot bugs by mapping actions on elements to objects and methods in JavaScript
4) Keep it object oriented
5) Don't worry about what `this` points to in an event handler
6) Attach one event handler to a container element and use event bubbling
7) No more worries about memory leaks because an element was removed from the document before event handlers were detached.

HTML5 data attributes are utilized to describe the behavior in HTML, which then gets mapped to methods in JavaScript.

`data-action="foo"` -- This maps to a method name on a JavaScript object.

`data-actionparams-click='{"id":123}'` -- Params serialied as JSON passed to the JavaScript method on-click.

Let's glue this together.

First, some JavaScript:

    function BlogPostController() {

    }
    BlogPostController.prototype = {

      view: function(event, element, params) {
        var post = BlogPost.find(params.id);

        // do something with the "post" variable
      },

      destroy: function(event, element, params) {
        var post = BlogPost.find(params.id);
        post.destroy();
      },

      create: function(event, element, params) {
        var post = new BlogPost();
        post.save();
      },

      edit: function(event, element, params) {
        var post = BlogPost.find(params.id);
        // render the edit form
      },

      update: function(event, element, params) {
        var form = element.form || element;
        var post = BlogPost.find(params.id);
        post.title = element.elements.title.value;
        post.save();
      }

    };

Now the Markup:

    <form action="#" data-action="update" data-actionparams-submit='{"id":23}' id="blog_post_form">
      Title: <input type="text" name="title">
      <button type="submit">Save</button>
    </form>

And finally the JavaScript to glue things together:

    // Instantiate your controller
    var blogPostController = new BlogPostController();

    // Instantiate the delegator
    blogPostController.delegator = new dom.events.Delegator(blogPostController, document.getElementById("blog_post_form"));
    
    // Add your action to event mapping
    blogPostController.delegator.setEventActionMapping({
      submit: ["create", "update"],
      click: ["edit", "view", "destroy"]
    });

    // Init the delegator and substribe to events
    blogPostController.delegator.init();

In this example, we subscribe to the `click` and `submit` events. Furthermore, only one such even exists because event bubbling is used to capture those events on a single parent element, like a `form` or `div`. No more detaching event handlers when removing nodes from the document tree to avoid memory leaks.

When the `submit` event is triggered, what happens? Well, look at the `data-action` attribute. It says `"update"`. That's the method on the blog post controller that gets executed.

## Action Handler Arguments:

1) The browser event object
2) The element with the `data-action` attribute on it.
3) Optional params taken from the data-actionparams-<event type> attribute on the element with the `data-action` attribute. If omitted, this is an empty object.