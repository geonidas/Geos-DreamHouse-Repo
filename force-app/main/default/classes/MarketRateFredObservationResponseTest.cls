/**
 * Tests for MarketRateFredObservationResponse.
 *
 * Pure deserialization — no SOQL, no DML, no callouts. These are the fastest
 * tests in the suite and cover the trickiest part of the integration: the
 * "date" -> "observationDate" rename that works around Apex's reserved type name.
 */
@isTest
private class MarketRateFredObservationResponseTest {

    @isTest
    static void parsesValidResponse() {
        String body = MarketRateCalloutMock.validBody('2026-08-26', '6.721');

        Test.startTest();
        MarketRateFredObservationResponse parsed =
            MarketRateFredObservationResponse.parse(body);
        Test.stopTest();

        Assert.isNotNull(parsed, 'Parse should return an object');
        Assert.isNotNull(parsed.observations, 'observations list should be populated');
        Assert.areEqual(1, parsed.observations.size(), 'Expected exactly one observation');
        Assert.areEqual('2026-08-26', parsed.observations[0].observationDate,
            'The "date" key should be remapped to observationDate');
        Assert.areEqual('6.721', parsed.observations[0].value,
            'Value should deserialize as a String, not a Decimal');
    }

    @isTest
    static void parsesEmptyObservationsList() {
        MarketRateFredObservationResponse parsed =
            MarketRateFredObservationResponse.parse(
                MarketRateCalloutMock.emptyObservationsBody());

        Assert.isNotNull(parsed.observations, 'Empty array should deserialize to an empty list');
        Assert.isTrue(parsed.observations.isEmpty(), 'List should contain no entries');
    }

    @isTest
    static void parsesMissingValueMarker() {
        // FRED writes "." for observations with no published value.
        String body = MarketRateCalloutMock.validBody('2026-08-26', '.');

        MarketRateFredObservationResponse parsed =
            MarketRateFredObservationResponse.parse(body);

        Assert.areEqual('.', parsed.observations[0].value,
            'The missing-value marker should survive parsing intact so callers can detect it');
    }

    @isTest
    static void ignoresUnknownJsonKeys() {
        // JSON.deserialize skips attributes with no matching class member.
        // This guards against FRED adding response fields and breaking the integration.
        String body = '{"observations":[{"date":"2026-08-26","value":"6.5",'
            + '"some_new_field_fred_added":"whatever"}],"brand_new_top_level":123}';

        MarketRateFredObservationResponse parsed =
            MarketRateFredObservationResponse.parse(body);

        Assert.areEqual('6.5', parsed.observations[0].value,
            'Unknown keys should be ignored rather than causing a deserialization failure');
    }

    @isTest
    static void handlesResponseWithNoObservationsKey() {
        // An error response has no observations array at all.
        MarketRateFredObservationResponse parsed =
            MarketRateFredObservationResponse.parse(MarketRateCalloutMock.errorBody());

        Assert.isNull(parsed.observations,
            'A body with no observations key should leave the list null, not throw');
    }
}