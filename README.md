# DOM Event Delegator

A simple, cross browser event delegation library with low dependencies that
allows you to easily map "actions" in custom HTML5 attributes to methods on an
object.

## Nostalgic for `onclick`

Remember way back in the Dark Ages of front end development when we used
`onclick` attributes with wanton disregard for the consequences? It wasn't the
easiest code to maintain, but darn it all, it was easy to troubleshoot when
something went wrong.

"I click the link and nothing happens," you say, bewildered.

You right-click on the page, view source. You see `onclick="foo(this)"`

"Yep, that's where things are going wrong. Has to be the 'foo' function," you
say with confidence.

Then along came unobtrusive JavaScript. This separated markup from behavior,
however there was no clear indication how actions by the user landed on
functions or methods in JavaScript. jQuery helped us out a little. We could
attach event handlers to elements using class names. When problems arose, it was
more difficult to troubleshoot.

"I click the link and nothing happens, hmmmm..." you ponder.

You right-click on the page, view source. You see `<a href="#" class="button">`.

"What the fffff..." you mutter as your train of thought trails off into a string
of obscenities.

To make matters worse, we often tied CSS styles to those class names, mixing
style and behavior. This is no better to maintain than our old, humble friend
the `onclick`.

## Making HTML5 Cake (So We Can Eat It Too)

The DOM Event Delegator was built with these things in mind:

1. JavaScript remains unobtrusive
2. Truly keep behavior, markup and style separated
3. Make it easier to trouble shoot bugs by using data-action attributes on HTML
   tags to map actions to objects and methods in JavaScript
4. Keep it object oriented
5. Don't shift the context of `this` when calling the event handler
6. Use event delegation, which means one event handler on a container element
7. No more worries about memory leaks because an element was removed from the
   document before event handlers were detached.

HTML5 data attributes are utilized to describe the behavior in HTML, which then
gets mapped to methods in JavaScript.

`data-action="update"` -- This maps to the "update" method on a JavaScript
object.

`data-actionparams-submit='{"id":123}'` -- Params serialized as JSON passed to
the JavaScript method on-submit.

Let's glue this together.

First, some JavaScript, which is a Plain Old JavaScript Object acting as our
controller:

    ```js
    function BlogPostController() {

    }
    BlogPostController.prototype = {

      update: function(event, element, params) {
        var form = element.form || element;
        var post = BlogPost.find(params.id);
        post.title = form.elements.title.value;
        post.save();
      }

    };
    ```

Now the Markup:

    ```html
    <div class="module"  id="update_blog_post">
      <form action="#" data-action="update" data-actionparams-submit='{"id":23}'>
        Title: <input type="text" name="title">
        <button type="submit">Save</button>
      </form>
    </div>
    ```

And finally the JavaScript to glue things together:

    ```html
      </form>
    </div><!-- end #update_blog_post -->

    <script type="text/javascript">

      // 1) Instantiate your controller
      var blogPostController = new BlogPostController();

      // 2) Get a reference to the containing element
      var container = document.getElementById("update_blog_post");

      // 3) Instantiate the delegator, passing the blogPostController in as the
      // "delegate" object, and the "container" to which all delegated
      // event handlers get attached
      var delegator = new dom.events.Delegator(blogPostController, container);
      
      // 4) Add your action to event mapping, which maps the "submit" event to the
      //    "update" method.
      delegator.setEventActionMapping({ submit: "update" });

      // 5) Init the delegator and substribe to events
      delegator.init();
      
    </script>
    ```

In this example, we attach the `submit` event handler to the container element,
`DIV#update_blog_post`. The `submit` event bubbles up from the `form` tag and is
captured by the event handler registered on the `div`. No more detaching event
handlers when removing nodes from the document tree to avoid memory leaks.

When the `submit` event is triggered, what happens? Well, look at the
`data-action` attribute of the `form`. It says `"update"`. That's the method on
BlogPostController that gets executed. If something goes wrong, start looking
there.

## Action Handler Arguments:

These arguments are passed to the `update` method on BlogPostController:

1. `event` -- The browser event object
2. `element` -- The element with the `data-action` attribute on it.
3. `params` -- Optional params taken from the `data-actionparams-submit` or
   `data-actionparams` attribute on the element with the `data-action`
   attribute. If omitted, this is an empty object.