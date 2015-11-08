(function(){

  var sides = {
        next: ['nextElementSibling', 'firstElementChild'],
        previous: ['previousElementSibling', 'lastElementChild']
      };

  function indexOfCard(deck, card){
    return Array.prototype.indexOf.call(deck.children, card);
  }

  function getCard(deck, item){
    return item && item.nodeName ? item : isNaN(item) ? xtag.queryChildren(deck, item)[0] : deck.children[item];
  }

  function checkCard(deck, card, selected){
    return card &&
           (selected == (card == deck.xtag.selected)) &&
           deck == card.parentNode &&
           card.nodeName.toLowerCase() == 'x-card';
  }

  function shuffle(deck, side, direction){
    var getters = sides[side];
    var selected = deck.xtag.selected && deck.xtag.selected[getters[0]];
    if (selected) deck.showCard(selected, direction);
    else if (deck.loop || deck.selectedIndex == -1) {
      deck.showCard(deck[getters[1]], direction);
    }
  }

  xtag.register('x-deck', {
    accessors: {
      loop: {
        attribute: { boolean: true }
      },
      transitionEnter: {
        attribute: {}
      },
      transitionExit: {
        attribute: {}
      },
      cards: {
        get: function(){
          return xtag.queryChildren(this, 'x-card');
        }
      },
      selectedCard: {
        get: function(){
          return this.xtag.selected || null;
        },
        set: function(card){
          this.showCard(card);
        }
      },
      selectedIndex: {
        attribute: {
          name: 'selected-index',
          validate: function(value){
            return value | '0';
          }
        },
        get: function(){
            return this.hasAttribute('selected-index') ? this.getAttribute('selected-index') | 0 : -1;
        },
        set: function(value){
          var card = this.cards[value];
          if (card) {
            if (card != this.xtag.selected) this.showCard(card);
          }
          else if (this.xtag.selected) this.hideCard(this.xtag.selected);
        }
      }
    },
    methods: {
      nextCard: function(){
        shuffle(this, 'next', 'forward');
      },
      previousCard: function(){
        shuffle(this, 'previous', 'reverse');
      },
      showCard: function(item, direction){
        var card = getCard(this, item);
        if (checkCard(this, card, false)) {
          var selected = this.xtag.selected,
              nextIndex = indexOfCard(this, card);
          direction = direction || card.transitionDirection || (nextIndex > indexOfCard(this, selected) ? 'forward' : 'reverse');
          if (selected) this.hideCard(selected, direction);
          this.xtag.selected = card;
          this.selectedIndex = nextIndex;
          if (!card.hasAttribute('selected')) card.selected = true;
          xtag.transition(card, 'show', {
            before: function(){
              card.removeAttribute('hide');
              card.setAttribute('show', '');
              card.setAttribute('transition-direction', direction);
            },
            after: function(){
              xtag.fireEvent(card, 'show');
            }
          });
        }
      },
      hideCard: function(item, direction){
        var card = getCard(this, item);
        if (checkCard(this, card, true)) {
          this.xtag.selected = null;
          if (card.hasAttribute('selected')) card.selected = false;
          xtag.transition(card, 'hide', {
            before: function(){
              card.removeAttribute('show');
              card.setAttribute('hide', '');
              card.setAttribute('transition-direction', direction || 'reverse');
            },
            after: function(){
              card.removeAttribute('hide');
              card.removeAttribute('transition');
              card.removeAttribute('transition-direction');
              xtag.fireEvent(card, 'hide');
            }
          });
        }
      }
    }
  });

  xtag.register('x-card', {
    lifecycle: {
      inserted: function (){
        var deck = this.parentNode;
        if (deck.nodeName.toLowerCase() == 'x-deck') {
          this.xtag.deck = deck;
          if (this != deck.selected && this.selected) deck.showCard(this);
        }
      },
      removed: function (){
        var deck = this.xtag.deck;
        if (deck) {
          if (this == deck.xtag.selected) {
            deck.xtag.selected = null;
            deck.removeAttribute('selected-index');
          }
          else deck.showCard(deck.selectedCard);
          this.xtag.deck = null;
        }
      }
    },
    accessors: {
      transitionDirection: {
        attribute: {}
      },
      transitionEnter: {
        attribute: {}
      },
      transitionExit: {
        attribute: {}
      },
      selected: {
        attribute: { boolean: true },
        set: function (val){
          var deck = this.xtag.deck;
          if (deck) {
            if (val && this != deck.selected) {
              deck.showCard(this);
            } else if (!val && this == deck.selected) {
              deck.hideCard(this);
            }
          }
        }
      }
    }
  });

})();
