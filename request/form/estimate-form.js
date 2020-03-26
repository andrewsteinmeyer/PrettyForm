
const WebFont = require('webfontloader');

WebFont.load({
  google: {
    families: ['Nunito']
  }
});

const FormStep = {
    SEARCH_ADDRESS: 1,
    LIST_QUESTION: 2,
    CONTRACT_QUESTION: 3,
    CONTACT_INFO: 4,
    TRANSACTION_DETAIL: 5,
    REPAIR_LIST: 6,
    ORDER_HOME_INSPECTION: 7,
    ORDER_PRELISTING: 8,
    PRICING: 9,
}

Template.estimateForm.onCreated(function() {

    this.state = new ReactiveDict();
    this.state.setDefault({
        step: 1,
    });

    // create internal id for estimate
    const internalId = new Mongo.ObjectID()._str;

    const estimate = {};
    estimate.internalId = internalId;
    estimate.refer = FlowRouter.getQueryParam("refer");
    estimate.affiliateId = FlowRouter.getQueryParam("pclid");
    estimate.affiliateCampaign = FlowRouter.getQueryParam("pcamp");

    this.estimateRequest = new ReactiveVar(estimate);

    this.checkout = StripeCheckout.configure({
        key: Meteor.settings.public.stripe,
        image: 'https://app.punchlistusa.com/img/logo-p.jpg',
        locale: 'auto',
        opened() {
            //console.log("Stripe was opened", args); 
            console.log("Stripe was opened.");

            Session.set("paymentProcessed", false);

        },
        token( token ) {

            Session.set("paymentProcessed", true);

            //console.log("Stripe was token.", token);

            let estimateRequest = this.estimateRequest.get();
            let charge  = {
                amount: token.amount || estimateRequest.service.amount*100,
                currency: token.currency || 'usd',
                source: token.id,
                description: token.description || "PunchList Estimate: " + estimateRequest.address.formatted_address,
                receipt_email: token.email
            };

            Meteor.call("saveEstimateRequest", estimateRequest, (e,r) => {

                if (e) {

                    console.log(e);
                    alert("There was an error saving your request.");

                    button.val("Request Estimate");
                    button.removeAttr("disabled");

                } else {

                    let estimateRequest = r;
                    this.estimateRequest.set(estimateRequest);

                    // Let's process the payment first and save it to the request.
                    Meteor.call( 'processEstimatePayment', estimateRequest, charge, token, ( error, response ) => {
                        console.log("processEstimatePayment finished.", error, response);
                        if (error) {

                        } else {
                            // Create the actual estimate.
                            Meteor.call("createEstimateFromRequest", estimateRequest._id, (e, r) => {
                                console.log(e, r);
                                if (e) {

                                } else {
                                    // Send Notifications and create workflow objections.
                                    Meteor.call("sendEstimateRequestNotifications", estimateRequest._id, (e, r) => {
                                        console.log(e, r);
                                    });

                                    // Show the receipt.
                                    FlowRouter.go("/receipt/" + estimateRequest._id + "/territory/" + estimateRequest.territory._id);
                                }
                            });
                        }
                    });
                }
            });

        },
        closed() {

            console.log("Stripe was closed");

            if (Session.get("paymentProcessed")) {
                console.log("Payment Processed Successfully");
            } else {

                console.log("Payment Abandoned");
            }

        }
    });

    this.saveAddress = (address) => {
        const request = this.estimateRequest.get();

        request.address = address;
        request.zipCode = address.zipCode;
        request.serviceable = address.serviceable;

        this.estimateRequest.set(request);
    }

    this.saveContacts = (contacts) => {
        const request = this.estimateRequest.get();

        request.contacts = contacts;

        this.estimateRequest.set(request);
    }

    this.saveCCEmails = (ccEmails) => {
        const request = this.estimateRequest.get();

        request.ccEmails = ccEmails;

        this.estimateRequest.set(request);  
    }

    this.saveTransactionDetail = (files, notes, closingDate, repairNeededBy) => {
        const request = this.estimateRequest.get();

        request.files = files;
        request.Notes = notes;
        request.ClosingDate = closingDate;
        request.Repairs = repairNeededBy;

        this.estimateRequest.set(request);
    }

    this.saveRepairList = (repairFiles, repairListNotes) => {
        const request = this.estimateRequest.get();

        // add to existing files
        if (request.files) {
            request.files.push(repairFiles);
        }
        // save if no files already exist
        else {
            request.files = repairFiles;
        }

        // add repairs to existing notes
        if (request.Notes && repairListNotes) {
            request.Notes += " " + repairListNotes;
        }
        // save to notes if no notes exist
        else {
            request.Notes = repairListNotes;
        }

        // notate if repair files are included
        if (repairFiles) {
            request.repairListIncluded = true;
        }

        // notate if repair notes are included
        if (repairListNotes) {
            request.repairNotesIncluded = true;
        }

        this.estimateRequest.set(request);
    }

    this.goBack = () => {
        const currentStep = this.state.get('step');
        this.state.set('step', currentStep - 1);
    }

    this.goToStep = (stepNumber) => {
        this.state.set('step', stepNumber);
    }

});


Template.estimateForm.helpers({

    // address bar component 
    addressBarArgs() {
        const instance = Template.instance();
        return {
            onAddressChange(address) {
                instance.saveAddress(address);
                instance.goToStep(FormStep.LIST_QUESTION);
            }
        }
    },

    // has list? component 
    listQuestionArgs() {
        const instance = Template.instance();
        return {
            hasList(hasList) {
                const nextStep = hasList ? FormStep.TRANSACTION_DETAIL : FormStep.CONTRACT_QUESTION;
                instance.goToStep(nextStep);
            },
            onGoBack() {
                instance.goBack();
            }
        }
    },

    // transaction detail component 
    transactionDetailArgs() {
        const instance = Template.instance();
        return {
            onDetailChange(files, notes, closingDate, repairNeededBy) {
                instance.saveTransactionDetail(files, notes, closingDate, repairNeededBy);
                instance.goToStep(FormStep.REPAIR_LIST);
            },
            onGoBack() {
                instance.goToStep(FormStep.LIST_QUESTION)
            }
        }
    },

    // repair list upload component 
    repairListArgs() {
        const instance = Template.instance();
        return {
            onRepairListChange(files, notes) {
                instance.saveRepairList(files, notes);
                instance.goToStep(FormStep.CONTACT_INFO);
            },
            onGoBack() {
                instance.goToStep(FormStep.TRANSACTION_DETAIL);
            }
        }
    },

    // estimate contact form component
    estimateContactFormArgs() {
        const instance = Template.instance();
        return {
            onContactsChange(contacts) {
                instance.saveContacts(contacts);
                instance.goToStep(FormStep.DETAILS);
            },
            onCCEmailsChange(ccEmails) {
                instance.saveCCEmails(ccEmails);
            },
            onGoBack() {
                instance.goBack();
            }
        }
    },

    // under contract? component 
    contractQuestionArgs() {
        const instance = Template.instance();
        return {
            isUnderContract(underContract) {
                const nextStep = underContract ? FormStep.ORDER_HOME_INSPECTION : FormStep.ORDER_PRELISTING;
                instance.goToStep(nextStep);
            },
            onGoBack() {
                instance.goBack();
            }
        }
    },

    stepIs(step) {
        const instance = Template.instance();
        const currentStep = instance.state.get('step');
        return (step == currentStep) ? "" : "display: none;";
    },

})

Template.estimateForm.events({


})