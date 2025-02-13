import becca_mocking = require('./becca_mocking');
import ValueExtractor = require('../../src/services/search/value_extractor');
import becca = require('../../src/becca/becca');
import SearchContext = require('../../src/services/search/search_context');

const dsc = new SearchContext();

describe('Value extractor', () => {
    beforeEach(() => {
        becca.reset();
    });

    it('simple title extraction', async () => {
        const europe = becca_mocking.note('Europe').note;

        const valueExtractor = new ValueExtractor(dsc, ['note', 'title']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(europe)).toEqual('Europe');
    });

    it('label extraction', async () => {
        const austria = becca_mocking.note('Austria').label('Capital', 'Vienna').note;

        let valueExtractor = new ValueExtractor(dsc, ['note', 'labels', 'capital']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(austria)).toEqual('Vienna');

        valueExtractor = new ValueExtractor(dsc, ['#capital']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(austria)).toEqual('Vienna');
    });

    it('parent/child property extraction', async () => {
        const vienna = becca_mocking.note('Vienna');
        const europe = becca_mocking.note('Europe').child(becca_mocking.note('Austria').child(vienna));

        let valueExtractor = new ValueExtractor(dsc, ['note', 'children', 'children', 'title']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(europe.note)).toEqual('Vienna');

        valueExtractor = new ValueExtractor(dsc, ['note', 'parents', 'parents', 'title']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(vienna.note)).toEqual('Europe');
    });

    it('extract through relation', async () => {
        const czechRepublic = becca_mocking.note('Czech Republic').label('capital', 'Prague');
        const slovakia = becca_mocking.note('Slovakia').label('capital', 'Bratislava');
        const austria = becca_mocking.note('Austria').relation('neighbor', czechRepublic.note).relation('neighbor', slovakia.note);

        let valueExtractor = new ValueExtractor(dsc, ['note', 'relations', 'neighbor', 'labels', 'capital']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(austria.note)).toEqual('Prague');

        valueExtractor = new ValueExtractor(dsc, ['~neighbor', 'labels', 'capital']);

        expect(valueExtractor.validate()).toBeFalsy();
        expect(valueExtractor.extract(austria.note)).toEqual('Prague');
    });
});

describe('Invalid value extractor property path', () => {
    it('each path must start with "note" (or label/relation)', () => expect(new ValueExtractor(dsc, ['neighbor']).validate()).toBeTruthy());

    it('extra path element after terminal label', () =>
        expect(new ValueExtractor(dsc, ['~neighbor', 'labels', 'capital', 'noteId']).validate()).toBeTruthy());

    it('extra path element after terminal title', () =>
        expect(new ValueExtractor(dsc, ['note', 'title', 'isProtected']).validate()).toBeTruthy());

    it('relation name and note property is missing', () => expect(new ValueExtractor(dsc, ['note', 'relations']).validate()).toBeTruthy());

    it('relation is specified but target note property is not specified', () =>
        expect(new ValueExtractor(dsc, ['note', 'relations', 'myrel']).validate()).toBeTruthy());
});
