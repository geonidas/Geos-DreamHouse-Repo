public with sharing class MarketRateFredObservationResponse {
    public List<Observation> observations;

    public class Observation {
        public String observationDate;  // renamed from "date"
        public String value;
    }

    public static MarketRateFredObservationResponse parse(String body) {
        return (MarketRateFredObservationResponse) JSON.deserialize(
            body.replace('"date"', '"observationDate"'),
            MarketRateFredObservationResponse.class
        );
    }
}