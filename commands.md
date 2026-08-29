# creating new scratch org (dreamhouse)
sf org create scratch -d -f config/project-scratch-def.json -a DreamHouseOrg30Day -y 30
sf project deploy start
sf org assign permset -n Dreamhouse
sf data import tree -p data/sample-data-plan.json