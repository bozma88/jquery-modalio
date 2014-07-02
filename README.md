## jquery-modalio

### A high *and* low-level plugin to create and manage in-page modals.


**Modalio** is a tiny plugin to display, generate, embed, populate, queue, stack or asynchronously load content into modals.
It’s super fast and 100% style-free.

I consider it a low-level plugin *and* an high-level one: it can be used *as-is* or extended, styled and customized in behaviour and appearance. In fact, very little default CSS is used, and it’s 100% overridable.

It differs from most other modal libraries because it even allows the injection of *already-in-page* elements, keeping their event bindings, data-properties and edit status (e.g. inputs).

Another really great feature is stacking: three policies are offered (queue|stack|swap), allowing you to open a modal with the default policy, or a per-modal overridden one. This way, you can choose how to handle the opening of multiple modals at once.


### Main features:

- 3 stacking policies offered
- Out-of-DOM persistence: closed modals are detached from DOM to lower memory consumption, but their state is retained for eventual reopening
- Simple templating engine to clone and populate an empty, structured DOM element used as a template
- Flash message support: you can flag a modal to be automatically opened upon page load
- `window.alert()` replacement for quick informational messages
- Messages can be differentiated by tipe. Every message type has a template you can define or extend from the default one
- Automatic Close button injection (configurable and templatable)
- Can be triggered programmatically or via DOM element’s attributes, without needing a single line of javascript
- Asynchronous loading of modal’s content
- Open modal get focused upon opening (even if no input elements are inside it)
- Modals can be closed by clicking on their bezel, on elements flagged to behave like close buttons (via data-attributes), by clicking on ESC or ENTER. Every option is configurable on a per-modal basis
- Page scroll is disabled when a modal is open (retaining current scroll position)
- Tested on IE 10+, FF, Chrome, Safari, Mobile Safari
- Needs jQuery 1.8+
- When a modal is closed, you can choose whether to process the queue stack (eventually opening the next queued modal) or to clear the queue.


### How-to:

Include assets in your page (*before* initializing Modalio):

```
<link rel="stylesheet" href="modalio.css">
<scrip src="modalio.js"></script>
```

You have to initialize Modalio *after* document is ready (or by placing this code in a `script` tag at the very end of your `body` element):

```
$(document).ready(function(){
	Modalio.init({options});
});
```

You can test Modalio immediately:

```
Modalio.message('Hello World!');
```

