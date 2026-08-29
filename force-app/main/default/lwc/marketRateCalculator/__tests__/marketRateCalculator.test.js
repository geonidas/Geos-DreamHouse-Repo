import { createElement } from '@lwc/engine-dom';
import MarketRateCalculator from 'c/marketRateCalculator';
import getLatestMarketRate from '@salesforce/apex/MarketRateController.getLatestMarketRate';
import getPropertyPrice from '@salesforce/apex/PropertyController.getPropertyPrice';

// Both Apex methods are wired, so both need adapter mocks.
jest.mock(
    '@salesforce/apex/MarketRateController.getLatestMarketRate',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

jest.mock(
    '@salesforce/apex/PropertyController.getPropertyPrice',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

const MOCK_RATE = {
    Id: 'a01000000000001',
    Mortgage_Rate__c: 6.5,
    Observation_Date__c: '2026-08-26'
};

const MOCK_PRICE = 300000;

describe('c-market-rate-calculator', () => {
    let element;

    beforeEach(() => {
        element = createElement('c-market-rate-calculator', {
            is: MarketRateCalculator
        });
        element.recordId = 'a02000000000001';
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    // Wire data emitted after appendChild resolves on a microtask, so tests
    // await a resolved promise before asserting on rendered output.
    function flushPromises() {
        return Promise.resolve();
    }

    function emitBothWires(rate = MOCK_RATE, price = MOCK_PRICE) {
        getLatestMarketRate.emit(rate);
        getPropertyPrice.emit(price);
    }

    describe('rate display', () => {
        it('renders the wired mortgage rate', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const formatted = element.shadowRoot.querySelectorAll(
                'lightning-formatted-number'
            );
            const rateEl = Array.from(formatted).find(
                (el) => el.formatStyle === 'percent-fixed'
            );

            expect(rateEl).not.toBeNull();
            expect(rateEl.value).toBe(6.5);
        });

        it('does not render the rate block before the wire resolves', async () => {
            document.body.appendChild(element);
            await flushPromises();

            const formatted = element.shadowRoot.querySelectorAll(
                'lightning-formatted-number'
            );
            expect(formatted.length).toBe(0);
        });

        it('does not render a rate when the controller returns null', async () => {
            // A fresh org before the first scheduled sync returns null, not an error.
            document.body.appendChild(element);
            getLatestMarketRate.emit(null);
            getPropertyPrice.emit(MOCK_PRICE);
            await flushPromises();

            const formatted = element.shadowRoot.querySelectorAll(
                'lightning-formatted-number'
            );
            expect(formatted.length).toBe(0);
        });
    });

    describe('loan term combobox', () => {
        it('defaults to the 30-year option', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const combobox = element.shadowRoot.querySelector('lightning-combobox');
            expect(combobox.value).toBe('360');
        });

        it('offers three term options as strings', async () => {
            document.body.appendChild(element);
            await flushPromises();

            const combobox = element.shadowRoot.querySelector('lightning-combobox');
            expect(combobox.options).toHaveLength(3);
            combobox.options.forEach((opt) => {
                expect(typeof opt.value).toBe('string');
            });
        });

        it('recalculates the payment when the term changes', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const paymentBefore = getMonthlyPaymentValue(element);

            const combobox = element.shadowRoot.querySelector('lightning-combobox');
            combobox.dispatchEvent(
                new CustomEvent('change', { detail: { value: '180' } })
            );
            await flushPromises();

            const paymentAfter = getMonthlyPaymentValue(element);
            expect(paymentAfter).toBeGreaterThan(paymentBefore);
        });
    });

    describe('down payment sync', () => {
        it('derives the percent from an amount entered directly', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const amountInput = element.shadowRoot.querySelector(
                '[data-id="downPaymentAmount"]'
            );
            amountInput.value = 60000;
            amountInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            const slider = element.shadowRoot.querySelector('lightning-slider');
            expect(slider.value).toBe(20); // 60000 / 300000
        });

        it('derives the amount from a slider drag', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const slider = element.shadowRoot.querySelector('lightning-slider');
            slider.dispatchEvent(
                // lightning-slider carries its value on event.detail, not event.target
                new CustomEvent('change', { detail: { value: 25 } })
            );
            await flushPromises();

            const amountInput = element.shadowRoot.querySelector(
                '[data-id="downPaymentAmount"]'
            );
            expect(amountInput.value).toBe(75000); // 25% of 300000
        });

        it('lowers the monthly payment as the down payment rises', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const paymentBefore = getMonthlyPaymentValue(element);

            const slider = element.shadowRoot.querySelector('lightning-slider');
            slider.dispatchEvent(new CustomEvent('change', { detail: { value: 20 } }));
            await flushPromises();

            expect(getMonthlyPaymentValue(element)).toBeLessThan(paymentBefore);
        });
    });

    describe('rate override', () => {
        it('uses the override instead of the live rate', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const livePayment = getMonthlyPaymentValue(element);

            const overrideInput = element.shadowRoot.querySelector(
                '[data-id="rateOverride"]'
            );
            overrideInput.value = 9;
            overrideInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            // 9% > the wired 6.5%, so the payment should rise.
            expect(getMonthlyPaymentValue(element)).toBeGreaterThan(livePayment);
        });

        it('shows the reset button only while overridden', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            expect(
                element.shadowRoot.querySelector('lightning-button')
            ).toBeNull();

            const overrideInput = element.shadowRoot.querySelector(
                '[data-id="rateOverride"]'
            );
            overrideInput.value = 7.25;
            overrideInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            expect(
                element.shadowRoot.querySelector('lightning-button')
            ).not.toBeNull();
        });

        it('reverts to the live rate when the override is cleared', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const livePayment = getMonthlyPaymentValue(element);

            const overrideInput = element.shadowRoot.querySelector(
                '[data-id="rateOverride"]'
            );
            overrideInput.value = 9;
            overrideInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            element.shadowRoot
                .querySelector('lightning-button')
                .dispatchEvent(new CustomEvent('click'));
            await flushPromises();

            expect(getMonthlyPaymentValue(element)).toBeCloseTo(livePayment, 2);
        });

        it('treats an emptied override field as no override', async () => {
            document.body.appendChild(element);
            emitBothWires();
            await flushPromises();

            const overrideInput = element.shadowRoot.querySelector(
                '[data-id="rateOverride"]'
            );
            overrideInput.value = 9;
            overrideInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            // Clearing must not coerce '' to 0 and show a 0% mortgage.
            overrideInput.value = '';
            overrideInput.dispatchEvent(new CustomEvent('change'));
            await flushPromises();

            expect(
                element.shadowRoot.querySelector('lightning-button')
            ).toBeNull();
        });
    });

    describe('error handling', () => {
        it('renders no payment when the rate wire errors', async () => {
            document.body.appendChild(element);
            getLatestMarketRate.error();
            getPropertyPrice.emit(MOCK_PRICE);
            await flushPromises();

            expect(getMonthlyPaymentValue(element)).toBeUndefined();
        });

        it('renders no payment when the property price wire errors', async () => {
            document.body.appendChild(element);
            getLatestMarketRate.emit(MOCK_RATE);
            getPropertyPrice.error();
            await flushPromises();

            expect(getMonthlyPaymentValue(element)).toBeUndefined();
        });
    });
});

// The payment is the only currency-formatted number on the card.
function getMonthlyPaymentValue(element) {
    const formatted = element.shadowRoot.querySelectorAll(
        'lightning-formatted-number'
    );
    const paymentEl = Array.from(formatted).find(
        (el) => el.formatStyle === 'currency'
    );
    return paymentEl ? paymentEl.value : undefined;
}