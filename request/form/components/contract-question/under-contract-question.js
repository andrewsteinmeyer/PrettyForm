Template.underContractQuestion.events({

    'click .js-go-back' (event, instance) {
        event.preventDefault();

        instance.data.onGoBack();
    },

    'click .js-under-contract' (event, instance) {
        event.preventDefault();

        instance.data.isUnderContract(true);
    },

    'click .js-no-contract' (event, instance) {
        event.preventDefault();

        instance.data.isUnderContract(false);
    },

})