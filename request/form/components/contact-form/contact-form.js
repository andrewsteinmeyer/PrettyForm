
Template.contactForm.onCreated(function () {

    this.state = new ReactiveDict();
    this.state.setDefault({
      showClientBlock: true,
    });

    this.contacts = new ReactiveVar([]);

});


Template.contactForm.helpers({

    showClientBlock() {
        const instance = Template.instance();
        return instance.state.get('showClientBlock');
    },

    emailForRequester() {
        const user = Meteor.user();
        if (!user || !user.profile || !user.profile.email) return "";

        return user.profile.email;
    },

    firstNameForRequester() {
        const user = Meteor.user();
        if (!user || !user.profile || !user.profile.firstName) return "";       
        
        return user.profile.firstName;
    },

    lastNameForRequester() {
        const user = Meteor.user();
        if (!user || !user.profile || !user.profile.lastName) return "";       
        
        return user.profile.lastName;
    }

})

Template.contactForm.events({

    "change #role": function(event, instance){

        var role = $("#role").val();

        if (role == "homeowner") {
            instance.state.set('showClientBlock', false);
            $("#other-block").fadeOut();

        } else if (role == "other") {
            instance.state.set('showClientBlock', true);
            $("#other-block").fadeIn();
            $("#clientTitle").text("Client Information");

        } else if (role == "buying") {
            instance.state.set('showClientBlock', true);
            $("#other-block").fadeOut();
            $("#clientTitle").text("Buyer Information");

        } else if (role == "selling") {
            instance.state.set('showClientBlock', true);
            $("#other-block").fadeOut();
            $("#clientTitle").text("Seller Information");

        } else if (role == "closing-sellers" || role == "closing-buyers") {
            instance.state.set('showClientBlock', true);
            $("#other-block").fadeOut();
            $("#clientTitle").text("Client Information");
        }

    },

    'click .js-go-back' (event, instance) {
        event.preventDefault();

        instance.data.onGoBack();
    },

    'click .js-select-contact' (event, instance) {
        event.preventDefault();

        // TODO: Legacy ccEmails.  I think we are going to remove this in the future. (Andrew)
        const ccEmails = instance.$("#ccEmail").val();

        if (ccEmails) {
            instance.data.onCCEmailsChange(ccEmails);
        }

        const contact = {
            firstName: instance.$("#firstName").val(),
            lastName: instance.$("#lastName").val(),
            name: instance.$("#firstName").val() + " " + instance.$("#lastName").val(),
            email: instance.$("#email").val(),
            phone: instance.$("#phone").val()
        }

        // create a contact for the requester in our system
        Meteor.call("findOrCreateEstimateContact", contact, (e, r) => {

            // make note that this contact originated request 
            contact._id = r;
            contact.isRequester = true;
            contact.role = instance.$("#role").val();

            // save extra role details if other is selected
            if (contact.role == "other") {
                contact.roleOther = instance.$("#other").val();
            }

            // create array of contacts and add requester
            instance.contacts.set( [ contact ] ); 

            // if role is not homeowner or buyer, we need to create contact for the client
            if (contact.role != "homeowner" && contact.role != "buyer") {

                const client = {
                    firstName: instance.$("#clientFirstName").val(),
                    lastName: instance.$("#clientLastName").val(),
                    name: instance.$("#clientFirstName").val() + " " + instance.$("#clientLastName").val(),
                    email: instance.$("#clientEmail").val()
                }

                // create a contact for the client in our system
                Meteor.call("findOrCreateEstimateContact", client, (e, r) => {

                    // save contactId for client
                    client._id = r;

                    // add client to contacts array
                    var contacts = instance.contacts.get() || [];
                    contacts.push(client)

                    // push client on estimate contacts array
                    instance.contacts.set(contacts);

                    const updatedContacts = instance.contacts.get();

                    if (updatedContacts) {
                        instance.data.onContactsChange(updatedContacts);
                    }            
                });

            // if role is homeowner or buyer, no need to create a duplicate contact
            } else {
                const updatedContacts = instance.contacts.get();

                if (updatedContacts) {
                    instance.data.onContactsChange(updatedContacts);
                }
            }

        });
        
    },
})