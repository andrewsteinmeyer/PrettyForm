

Template.hasListQuestion.events({

    'click .js-go-back' (event, instance) {
        event.preventDefault();

        instance.data.onGoBack();
    },

    'click .js-has-list' (event, instance) {
        event.preventDefault();

        instance.data.hasList(true);
    },

    'click .js-no-list' (event, instance) {
        event.preventDefault();

        instance.data.hasList(false);
    },

})