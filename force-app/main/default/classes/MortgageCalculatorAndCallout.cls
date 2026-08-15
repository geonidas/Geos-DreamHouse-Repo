public with sharing class MortgageCalculatorAndCallout {
    
    public class FredObservationResponse {
        public List<Observation> observations;

        public class Observation {
            public String observationDate;  // renamed from "date"
            public String value;
        }

        public static FredObservationResponse parse(String body) {
            return (FredObservationResponse) JSON.deserialize(
                body.replace('"date"', '"observationDate"'),
                FredObservationResponse.class
            );
        }
    }

    
}