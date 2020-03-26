

Template.transactionDetail.onCreated(function () {

    this.state = new ReactiveDict();
    this.state.setDefault({
      uploading: false,
    });

    this.files = new ReactiveVar([]);

});

Template.transactionDetail.helpers({

    files() {
        const instance = Template.instance();
        return instance.files.get();
    },

})

Template.transactionDetail.events({

    "click .js-upload": function(event, instance) {

        instance.state.set('uploading', true);

        var files = instance.files.get() || [];

        var myWidget = cloudinary.createUploadWidget({
          cloudName: 'punchlist', 
          uploadPreset: 'fedpjd6q',
          sources: [ 'local', 'url', 'camera']
        }, (error, result) => { 

            if (error) {

            } else if (result) {

                switch(result.event) {

                    case "success":

                        var cloudFile = result.info;

                        // add to files
                        files.push(cloudFile);

                        // set files on template
                        instance.files.set(files);

                        instance.state.set('uploading', false);

                        var btn = instance.$(".js-continue");
                        btn.text("Continue");

                        break;

                    case "close":

                        instance.state.set('uploading', false);
                        break;

                    default: 
                    
                }

            }

        })

        myWidget.open();

    },

    'click .js-go-back' (event, instance) {
        event.preventDefault();

        instance.data.onGoBack();
    },

    'click .js-continue' (event, instance) {
        event.preventDefault();

        const files = instance.files.get() || [];

        const notes = instance.$("#details").val() || "";
        const closingDate = instance.$("#closing").val() || null;
        const repairNeededBy = instance.$("#repairs").val() || "";

        instance.data.onDetailChange(files, notes, closingDate, repairNeededBy);
    }

})