 /**
 * Modalio is a tiny plugin to generate on-the-fly modals or open modals already present in the DOM.
 * It even supports templates, that you can populate before opening them.
 * Three stacking policies can be defined on a per-modal basis (with default behaviour fallback):
 *   - queue: a modal opened when another modal is already open gets queued and is shown when visible modal is closed
 *   - stack: modal gets opened above the current one. When it will be closed, the previously open modal will re-appear
 *   - swap: new modal replaces the current one, that gets closed and won’t be reopened
 *
 * Modal inceptions does not lead to heavy memory consumption (especially GPU)
 * because each time a modal is hidden, it gets detached from thm DOM (but cached in javascript for re-opening).
 *
 * @author Marco Bozzola <marco@basili.co>
 *
 * USAGE:
 *   - TODO
 *
 */
;var Modalio = (function($){

  // This is the modal external container prototype
  var $skel = $('<div class="modalio-overlay" tabindex="1"><div class="modalio-wrapper-outer"><div class="modalio-wrapper-inner"></div></div></div>');
  var cachedModals = {};  // Already-embedded modals get cached for performance
  var stack = []; // Stack that keeps track of queued modals to show
  var $openModal; // Currently open modal is stored for convenience


  // These options can be overridden on a per-modal basis
  var defaultOptions = {
    wrappers: {
      message: '<div class="modalio-message"></div>'  // Wrappers for messages (default and custom typed ones) can be overridden
    },
    closeOnOuterClick: true, // Whether to close open modal by clicking on surrounding overlay
    closeOnEsc: true, // Whether to close open modal by pressing ESC on keyboard
    openFlashMessage: true, // Whether to search for a flash message container at plugin initialization
    policy: 'swap' // Stacking policy {swap|stack|queue}
  };


  /**
   * Init handlers.
   */
  var init = function(customOptions){
    _config(customOptions);
    _attachHandlers();
    _findFlashMessage();
  };


  /**
   * Displays a text message in a standard modal.
   */
  var message = function(message, type, options){

    var options = $.extend(true, {}, defaultOptions, options);

    var type = type || 'message';

    if (!(type in options.wrappers)) {
      return false;
    }

    var $wrapper = $(options.wrappers[type]).html(message);
    var $modal = $skel.clone(true);
    $modal.data('options', options);
    $modal.data('type', type);
    $modal.find('.modalio-wrapper-inner').append($wrapper);

    _push($modal);
    _open(stack[0]);

    return $modal;
  };


  /**
   * Embeds a DOM element inside a modal, caching the result.
   */
  var embed = function(elementId, options){

    var options = $.extend(true, {}, defaultOptions, options);

    var $modal;

    // If modal is already cached
    if (elementId in cachedModals) {

      $modal = cachedModals[elementId];

    } else if ($(elementId).length) {

      // Embed wrapper into modal skel
      var $wrapper = $(elementId);
      $wrapper.css('display', 'block');

      $modal = $skel.clone(true);
      $modal.data('options', options);
      $modal.data('type', 'embed');
      $modal.data('cache-id', elementId);
      $modal.find('.modalio-wrapper-inner').append($wrapper);

    } else {
      // Not found, abort
      return false;
    }

    _push($modal);
    _open(stack[0]);

    return $modal;
  };


  /**
   * Embeds a DOM template inside a modal, without caching it.
   * Variables to inject are passed through a map,
   * where keys are used as class selectors, and their values as content.
   */
  var embedTemplate = function(templateId, data, options){

    var options = $.extend(true, {}, defaultOptions, options);
    var data = data || {};

    var $modal;
    var $template = $(templateId);

    // Return if no match
    if (!$template.length) {
      return false;
    }

    var $instance = $template.clone(true);
    $instance.css('display', 'block');

    // Populate data
    for (var key in data) {
      // Filter prototype’s keys
      if (p.hasOwnProperty(key)) {
        $instance.find('.'+key).html(data[key]);
      }
    }

    $modal = $skel.clone(true);
    $modal.data('options', options);
    $modal.data('type', 'template');
    $modal.find('.modalio-wrapper-inner').append($instance);

    _push($modal);
    _open(stack[0]);

    return $modal;
  };


  /**
   * Asynchronously loads content and injects it into a modal.
   */
  var load = function(url, target, options){

    var options = $.extend(true, {}, defaultOptions, options);

    // Compose destination URL + target filter
    var url = target ? (url + ' #' + target) : url;

    $modal = $skel.clone(true);
    $modal.data('options', options);
    $modal.data('type', 'load');
    // $modal.data('cache-id', url); // TODO: caching
    $modal.find('.modalio-wrapper-inner').load(url, function(){
      _push($modal);
      _open(stack[0]);
    });
  };


  /**
   * Closes the open modal, eventually clearing the queue.
   */
  var close = function(clearQueue){
    var clearQueue = clearQueue || false;
    if (clearQueue) {
      stack = [];
    }
    if ($openModal) {
      _close($openModal);
    }
    return stack.length;
  };


  /**
   * Low level method to open a specified modal.
   */
  var _open = function($modal){
    if ($openModal) {
      // Do not reopen an already-open modal
      if ($modal.is($openModal)) {
        return;
      } else {
        _close($openModal, true)
      }
    }

    // Disable page scrolling
    _disableScroll();

    // Append modal
    $('body').append($modal);
    $modal.focus(); // Give the modal focus
    $openModal = $modal;
  };


  /**
   * Low level method to close a specified modal.
   * It eventually caches it, if type is suitable.
   */
  var _close = function($modal, noIterate){
    // Don’t close a unopened modal
    if (!$modal.is($openModal)) {
      return;
    }

    switch ($modal.data('type')) {
      case 'embed':
        // Cache modal
        cachedModals[$modal.data('cache-id')] = $modal;
        break;
    }

    $modal.detach(); // Detach keeps events, in case of re-appends
    $openModal = null;

    // Re-enable page scrolling
    _enableScroll();

    // If there’s queue and iteration over stack is permitted, process it
    if (!noIterate) {
      var queueLength = _pop();
      if (queueLength) {
        _open(stack[0]);
      }
    }
  };


  /**
   * Pushes a modal into the opening stack following the specified policy.
   */
  var _push = function($modal){
    var policy = $modal.data('options').policy;
    switch (policy) {
      case 'queue':
        stack.push($modal);
        break;

      case 'stack':
        stack.unshift($modal);
        break;

      case 'swap':
      default:
        stack[0] = $modal;
    }
  };


  /**
   * Pops the first modal from the stack.
   */
  var _pop = function() {
    if (stack.length) {
      stack.splice(0, 1)[0];
    }
    return stack.length;
  }


  /**
   * Attaches all the event handlers.
   */
  var _attachHandlers = function(){

    // Bind only those anchors which have a href and a 'data-modalio' attribute
    $('body').on('click', 'a[href][data-modalio]', function(e){
      e.preventDefault();

      var $this = $(this);

      // Extend modal options with custom settings
      var inlineOptions = {};
      var policy = $this.data('modalio');
      if (policy) { inlineOptions.policy = policy; }

      var href = $(this).attr('href');
      switch(href.charAt(0)) {
        case '#':
          // Embed something that’s already in the page
          embed(href, inlineOptions);
        default:
          // Eventually load only a fragment of the external page
          var target = $this.data('modalio-target');
          load(href, target, inlineOptions);
      }
    });

    // Bind global hotkeys
    $('body').on('keydown', function(e){
      if ($openModal) {
        if ($openModal.data('options').closeOnEsc) {
          if (27 === e.which) {
            _close($openModal);
          }
        }
      }
    });

    // Bind modal skel events
    $skel.on('click', function(e){
      var $this = $(this);
      var options = $this.data('options');

      switch (e.type) {
        case 'click':
          // Close the modal
          if (options.closeOnOuterClick) {
            // Close if the overlay was clicked
            if ($(e.target).hasClass('modalio-overlay')) {
              _close($this);
            }
          }
          break;
      }
    });
  };


  /**
   * Searches for a flashmessage to display immediately on Modalio.init().
   */
  var _findFlashMessage = function(){
    if (defaultOptions.openFlashMessage) {
      var $flashMessage = $('body').find('#modalio-flash');
      if ($flashMessage.length) {
        embed($flashMessage);
      }
    }
  };


  /**
   * Permanently extends default settings.
   */
  var _config = function(customOptions){
    $.extend(true, defaultOptions, customOptions);
  };


  /**
   * Disables page scroll while retaining current scroll position.
   */
  var _disableScroll = function(){
    $('html').css('overflow', 'hidden');
  };


  /**
   * Re-enables page scroll.
   */
  var _enableScroll = function(){
    $('html').css('overflow', 'auto');
  };


  // Public API
  var api = {
    init: init,
    message: message,
    embed: embed,
    embedTemplate: embedTemplate,
    load: load,
    close: close
  };


  return api;

})(jQuery);