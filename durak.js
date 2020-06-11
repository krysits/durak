#!/usr/bin/node
"use strict";
console.log('== Card Game `Durak` by @krysits.COM ==');

const DEBUG = !!process.argv[2];

const SPADES = 0;
const DIAMONDS = 1;
const CLUBS = 2;
const HEARTS = 3;

const CLONE = null;
const LESS = -1;
const EQUAL = 0;
const MORE = 1;

const TWO = 2;
const THREE = 3;
const FOUR = 4;
const FIVE = 5;
const SIX = 6;
const SEVEN = 7;
const EIGHT = 8;
const NINE = 9;
const TEN = 10;
const JACK = 11;
const QUEEN = 12;
const KING = 13;
const ACE = 14;

const NEW = 0;
const OLD = 1;
const ATTACK = 2;
const DEFEND = 3;
const HANDS = 4;

const TABLE_SIZE = 6;
const DECK_SIZE = 52;

class RegistryCard {
	constructor(rank, suit){
		this.rank = rank;
		this.suit = suit;
		this.setId();
		this.owner = NEW;
		this.is_trump = false;
	}
	setId() {
		const isOk = typeof this.suit !== 'undefined' && typeof this.rank !== 'undefined';
		this.id = isOk ? this.suit + '_' + this.rank : null;
	}
	compare(b) {
		if(this.isClone(b)) return CLONE;
		if(this.isLess(b)) return LESS;
		if(this.isEqual(b)) return EQUAL;
		if(this.isMore(b)) return MORE;
	}
	isClone(b){
		return this.rank === b.rank && this.suit === b.suit;
	}
	isEqual(b) {
		return this.rank === b.rank && this.suit !== b.suit && !this.is_trump && !b.is_trump;
	}
	isLess(b) {
		return (this.rank < b.rank && this.suit === b.suit)
			|| (!this.is_trump && b.is_trump);
	}
	isMore(b) {
		return (this.rank > b.rank && this.suit === b.suit)
			|| (this.is_trump && !b.is_trump);
	}
	isTrump(trumpSuit) {
		return this.is_trump = this.suit === trumpSuit;
	}
}
class Registry {
	constructor(trump){
		this.cards = [];
		this.shake();
		this.shuffle();
		this.setTrump(trump);
	}
	shake(){
		for(let j = SPADES; j <= HEARTS; j++) {
			for(let i = TWO; i <= ACE; i++) {
				this.cards[this.cards.length] = new RegistryCard(i, j);
			}
		}
	}
	shuffle() {
		for (let i = 0; i < this.cards.length; i++) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}
	setTrump(trump) {
		this.trump = trump >= 0 ? trump : this.cards[this.cards.length - 1].suit;
		for (let i = 0; i < this.cards.length; i++) {
			this.cards[i].isTrump(this.trump);
		}
	}
	getIndex(card) {
		if(!(card instanceof RegistryCard)) {
			return -1;
		}
		for(let i = 0; i < this.cards.length; i++) {
			if(this.cards[i] instanceof RegistryCard && this.cards[i].id === card.id) {
				return i;
			}
		}
		return -1;
	}
	setOwner(index, value) {
		if(this.cards[index] instanceof RegistryCard && index >= 0 && index < this.cards.length) {
			return {
				older: this.cards[index].owner,
				newer: this.cards[index].owner = value
			};
		}
		return false;
	}
	getAllCardsByOwner(owner) {
		let hand = [];
		for(let i = 0; i < this.cards.length; i++) {
			if(this.cards[i].owner === owner){
				hand.push(this.cards[i]);
			}
		}
		return hand;
	}
	getCountByOwner(owner) {
		let count = 0;
		for(let i = 0; i < this.cards.length; i++) {
			this.cards[i].owner === owner && ++count;
		}
		return count;
	}
}
class RegistryGame {
	constructor(playersCount = 4){
		this.registry = new Registry;
		this.setId();
		this.gameOver = false;
		this.players = [];
		this.playersCount = playersCount;
		this.totalWinner = null;
		this.winners = [];
		this.setupPlayers();
		this.dealPosition = 0;
		this.firstDeal();
		this.activePlayer;
		this.defencePlayer;
		this.algorithm();
	}
	setId() {
		let idCode = '';
		for(let n = 0; n < 5; n++) {
			idCode += String.fromCharCode(97 + Math.floor(Math.random()*23)+1);
		}
		this.id = 'game_'+idCode+'_'+(Math.floor(Math.random()*1000)+1);
	}
	setupPlayers() {
		for(let i = 0; i < this.playersCount; i++) {
			let playerIndex = HANDS + i;
			this.players[this.players.length] = new RegistryPlayer(playerIndex);
		}
	}
	firstDeal() {
		this.dealPosition = 0;
		for(let j = 0; j < this.playersCount; j++) {
			for(let i = 0; i < TABLE_SIZE; i++) {
				this.registry.setOwner(this.dealPosition++, this.players[j].index);
			}
		}
		return this.dealPosition;
	}
	isWinner(player) {
		for(let j = 0; j < this.playersCount; j++) {
			if(this.players[j].id == player.id && this.winners.indexOf(player.id) !== -1){
				return true;
			}
		}
		return false;
	}
	isGameOver() {
		let result = false;
		if(this.dealPosition >= DECK_SIZE) {
			this.winners = [];
			for(let j = 0; j < this.playersCount; j++) {
				let cardCount = this.registry.getCountByOwner(HANDS + j);
				if(cardCount === 0 ) {
					if(!this.totalWinner) {
						this.totalWinner = this.players[j].id;
					}
					this.winners.push(this.players[j].id);
				}
			}
			result = (this.playersCount - this.winners.length) === 1;
		}
		return this.gameOver = result;
	}
	nextDeal() {
		if(this.isGameOver()) {
			return -1;
		}
		for(let j = 0; j < this.playersCount; j++) {
			let handSize = this.registry.getCountByOwner(this.players[j].index);
			for(let i = 0; i < TABLE_SIZE - handSize; i++) {
				if(this.dealPosition < DECK_SIZE) {
					this.registry.setOwner(this.dealPosition++, this.players[j].index);
				}
				else {
					this.gameOver = true;
					return -1;
				}
			}
		}
		return this.dealPosition;
	}
	takeAll(activePlayer) {
		if(!(activePlayer instanceof RegistryPlayer)) {
			return false;
		}
		let attackCards = this.registry.getAllCardsByOwner(ATTACK);
		let defendCards = this.registry.getAllCardsByOwner(DEFEND);
		for(let i = 0; i < attackCards.length; i++) {
			let cardIndex = this.registry.getIndex(attackCards[i]);
			if(cardIndex !== -1) {
				this.registry.setOwner(cardIndex, activePlayer.index);
			}
		}
		for(let i = 0; i < defendCards.length; i++) {
			let cardIndex = this.registry.getIndex(defendCards[i]);
			if(cardIndex !== -1) {
				this.registry.setOwner(cardIndex, activePlayer.index);
			}
		}
	}
	respondCard(attackCard, defenceCard) {
		if( !(attackCard instanceof RegistryCard && defenceCard instanceof RegistryCard)) {
			return false;
		}
		if(
			attackCard.isLess(defenceCard)
		) {
			this.registry.setOwner(this.registry.getIndex(defenceCard), DEFEND);
			return true;
		}
		else {
			return false;
		}
	}
	closeTurn() {
		let attackCards = this.registry.getAllCardsByOwner(ATTACK);
		for(let i = 0; i < attackCards.length; i++){
			this.registry.setOwner(this.registry.getIndex(attackCards[i]), OLD);
		}
		let defendCards = this.registry.getAllCardsByOwner(DEFEND);
		for(let i = 0; i < defendCards.length; i++){
			this.registry.setOwner(this.registry.getIndex(defendCards[i]), OLD);
		}
		return true;
	}
	updatePlayer(activePlayer) {
		return activePlayer.update(this.registry);
	}
	addByRank(rank) {
		for (let j = 0; j < this.players.length; j++) {
			if (
				this.defencePlayer.id !== this.players[j].id
			) {
				let giveMore = this.players[j].getAllCardsByRank(rank);
				for (let p = 0; p < giveMore.length; p++) {
					if (this.registry.getCountByOwner(ATTACK) < TABLE_SIZE) {
						this.registry.setOwner(this.registry.getIndex(giveMore[p]), ATTACK);
					}
				}
				this.updatePlayer(this.players[j]);
			}
		}
	}
	algorithm() {
		if(DEBUG) {
			console.log(this.registry.cards);
		}
		let stepCounter = 0;
		gamePoint: while (!this.isGameOver()) {

			do {
				this.activePlayer = this.players[stepCounter % this.players.length];
				if (this.isGameOver()) break gamePoint;
				else stepCounter++;
			}
			while (this.isWinner(this.activePlayer));

			do {
				this.defencePlayer = this.players[stepCounter % this.players.length];
				if (this.isGameOver()) break gamePoint;
				else stepCounter++;
			}
			while (this.isWinner(this.defencePlayer));

			this.updatePlayer(this.activePlayer);
			this.updatePlayer(this.defencePlayer);
			// iet ar mazakaam
			let turnCards = this.activePlayer.getLeastCards();
			for (let i = 0; i < turnCards.length; i++) {
				if (
					turnCards[i] instanceof RegistryCard
					&& this.registry.getCountByOwner(ATTACK) < TABLE_SIZE
				) {
					this.registry.setOwner(this.registry.getIndex(turnCards[i]), ATTACK);
				}
			}
			this.updatePlayer(this.activePlayer);
			// piemet
			if (turnCards[0] instanceof RegistryCard) {
				this.addByRank(turnCards[0].rank);
			}
			// megina atsist
			let done;
			let lastRank1 = null;
			let lastRank2 = null;
			let attackCards = this.registry.getAllCardsByOwner(ATTACK);
			tablePoint: for (let i = 0; i < this.registry.getCountByOwner(ATTACK); i++) {
				let attackCard = attackCards[i];
				done = false;
				// megina atsist katru karti
				for (let k = 0; k < this.registry.getCountByOwner(this.defencePlayer.index); k++) {
					let defenceCard = this.defencePlayer.cardSet[k];
					if (this.respondCard(attackCard, defenceCard)) {
						// return console.log('sitam: ',
						// 	this.registry.getCountByOwner(ATTACK),
						// 	this.registry.getCountByOwner(DEFEND));
						lastRank1 = defenceCard.rank;
						lastRank2 = attackCard.rank;
						done = true;
						this.updatePlayer(this.activePlayer);
						this.updatePlayer(this.defencePlayer);
						continue tablePoint;
					}
				}
				// parejie piemet vel
				if (done && (lastRank1 !== null || lastRank2 !== null)) {
					for (let j = 0; j < this.playersCount; j++) {
						if (
							this.defencePlayer.id !== this.players[j].id
							&& this.registry.getCountByOwner(ATTACK) < TABLE_SIZE
						) {
							let giveMore = this.players[j].getAllCardsByRank(lastRank1, lastRank2);
							for (let p = 0; p < giveMore.length; p++) {
								if (this.registry.getCountByOwner(ATTACK) < TABLE_SIZE) {
									this.registry.setOwner(this.registry.getIndex(giveMore[p]), ATTACK);
								}
							}
						}
						this.updatePlayer(this.players[j]);
					}
				} else {
					if(DEBUG) {
						console.log('nevar - pacelj');
					}
					this.takeAll(this.defencePlayer);
				}
			}
			this.updatePlayer(this.defencePlayer);
			// nosledz gajienu
			this.closeTurn();
			// visi pacel vajadzigo skaitu karsu
			this.nextDeal();
			this.showDebug();
		}
		this.showResults();
	}
	showDebug() {
		if(DEBUG){
			console.log('sadalijums: ',
				this.registry.getCountByOwner(OLD),
				this.registry.getCountByOwner(NEW),
				this.registry.getCountByOwner(ATTACK),
				this.registry.getCountByOwner(DEFEND)
			);
			console.log('gajiens: ', this.activePlayer.id, this.defencePlayer.id);
		}
	}
	showResults() {
		console.log('= game over =');
		for(let i = 0; i < this.playersCount; i++) {
			console.log('= results = ',
				this.players[i].id,
				this.isTotalWinner(this.players[i]),
				this.registry.getCountByOwner(HANDS + i),
				this.isWinner(this.players[i])
			);
		}
	}
	isTotalWinner(player) {
		if(!(player instanceof RegistryPlayer)) return false;
		return player.id === this.totalWinner;
	}
}
class Rank {
	constructor() {
		this.index = 0;
		this.ranks = [
			null,
			null,
			'TWO',
			'THREE',
			'FOUR',
			'FIVE',
			'SIX',
			'SEVEN',
			'EIGHT',
			'NINE',
			'TEN',
			'JACK',
			'QUEEN',
			'KING',
			'ACE'
		];
	}
	getRank(index){
		return this.ranks[this.index = index]
	}
}
class Suit {
	constructor() {
		this.index = -1;
		this.suits = ['SPADES','DIAMONDS','CLUBS','HEARTS'];
	}
	getSuit(index){
		return this.suits[this.index = index]
	}
}
class RegistryPlayer {
	constructor(index = HANDS) {
		this.setId();
		this.index = index;
		this.cardSet = [];
	}
	setId() {
		let idCode = '';
		for(let n = 0; n < 5; n++) {
			idCode += String.fromCharCode(97 + Math.floor(Math.random()*23)+1);
		}
		this.id = 'player_'+idCode+'_'+(Math.floor(Math.random()*1000)+1);
	}
	addCard(card) {
		if(card instanceof Card && !this.hasCard(card)) {
			this.cardSet.push(card);
			return true;
		}
		return false;
	}
	hasCard(card) {
		if(!(card instanceof RegistryCard)) {
			return false;
		}
		for(let i = 0; i < this.cardSet.length; i++) {
			if(this.cardSet[i].id === card.id) {
				return true;
			}
		}
		return false;
	}
	getLeastCards() {
		let leastCard = this.cardSet[0];
		let cards = [];
		for (let i = 1; i < this.cardSet.length; ++i) {
			if (this.cardSet[i].compare(leastCard, this.trump) === LESS) {
				leastCard = this.cardSet[i];
			}
		}
		for (let i = 0; i < this.cardSet.length; ++i) {
			if(leastCard.rank === this.cardSet[i].rank) {
				cards.push(this.cardSet[i]);
			}
		}
		return cards;
	}
	getAllCardsByRank(rank, rank2) {
		let cards = [];
		for (let i = 0; i < this.cardSet.length; ++i) {
			if(
				this.cardSet[i].rank === rank
				|| this.cardSet[i].rank === rank2
			) {
				cards.push(this.cardSet[i]);
			}
		}
		return cards;
	}
	compareSet() {
		return function(a, b) {
			if (a.isMore(b)) {
				return 1;
			}
			if (a.isLess(b)) {
				return -1;
			}
			return 0;
		}
	}
	update(registry) {
		return this.cardSet = registry.getAllCardsByOwner(this.index);
	}
	sort() {
		this.cardSet.sort(this.compareSet);
	}
}

new RegistryGame;