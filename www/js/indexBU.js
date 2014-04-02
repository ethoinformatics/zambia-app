var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.onDeviceReady(); //for browser debugging
        app.debug('init');
        //console.log('MOBILE ________________' + $.mobile.allowCrossDomainPages);

    },
    // Bind Event Listeners
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('#sighting_time').bind('click',this.trackSightingTime);
        $('#save_pheno_obs').bind('click',this.savePhenotypeSighting);
        //$('#frequency_input').bind('change',this.frequencySync);
        //$('#frequency_slider').bind('change',this.frequencySync);
        $('#phenotype_select').bind('change',this.phenoSelectListener);
        $('#obs_activity_list > li').bind('click',this.obsActivitySelectListener);
        /*$('#sighting_notepad_icon').bind('click',function(){
            $('#sighting_notes_wrap').toggle();
        });*/
        //
        $('#sync_remote').bind('click',this.couchSync);
        //$('#reset').bind('click',this.resetDB);
    },
    // deviceready Event Handler
    onDeviceReady: function() {
        app.debug('device ready');
    },
    sighting_clock_running: false,
    obs_activity_clock_running: false,
    current_sighting: {phenotype_sightings:[]},
    sighting_notes: '',
    current_obs_activity: {},

    time_format: "YYYY-MM-DD HH:mm:ss.SSS ZZ", // for momentJS library

    // (placeholder) listen for GPS
    gpsListener: function(){
        // get coords
        coords = {gps: true, lat: 40.730473, long: -73.994844, timestamp: Date.now() };
        // store to DB
        dBase.add(coords);
    },
    trackSightingTime: function(){
        if (app.sighting_clock_running){ //stop time
            app.current_sighting.end_time = moment().format(app.time_format);
            app.sighting_clock_running = false;
            this.innerHTML = 'Start Sighting';
            //timer status
            $('#timer_status').addClass('off');
            $('#timer_status').html('Timer stopped');

            app.current_sighting.sighting_notes = $('#sighting_notes').val();
            //console.log(app.current_sighting);
            // show sync button
            $('#sync_remote').show();

            // save to local db
            app.saveSighting();
            /*dBase.all(function(results){
                //console.log(results);
                for (r in results){
                    app.debug(results[r].doc.sighting_notes);
                }
            });*/
            
        } else { //start time
            app.current_sighting.start_time = moment().format(app.time_format);//Date.now();
            //$('#msg').append(app.current_sighting.start_time);
            app.sighting_clock_running = true;
            this.innerHTML = 'End Sighting';
            //timer status
            $('#timer_status').addClass('on');
            $('#timer_status').html('Timer running');

            //show sighting notes button
            $('#sighting_notes_button').show();

            // set up phenotype selection menu
             app.makePhenotypeSelect();

            // open up phenotype entry when timer has started
            $('#pheno_obs').show();
            // hide sync button -- can't sync while timer is running
            $('#sync_remote').hide();
            // hide records div -- no records yet
            $('#pheno_obs_records').hide();
        } 
    },
    trackObserverActivityTime: function(){
        if (app.obs_activity_clock_running){ // stop  timer
            app.obs_activity_clock_running = false;
            app.current_obs_activity.end_time = moment().format(app.time_format); 
        } else { // start timer
            app.obs_activity_clock_running = true;
            app.current_obs_activity.start_time = moment().format(app.time_format); 
        }
    },
    saveSighting: function(){
        // store to local db
        /*
        // structure of sighting object
        obj = {
            start_time: app.start_time,
            end_time: app.end_time,
            sighting_notes: '',
            phenotype_sightings: [],
            census_animals: []
        };*/
        dBase.add(app.current_sighting);
    },
    getPhenotypes: function(){
        //mocked up for now
        return {1:'light muzzle',2:'mohawk',3:'small pink swelling'};
        //return ['light muzzle','mohawk','small pink swelling'];
    },
    getObserverActivities: function(){
        //mocked up for now
        return {1:'driving',2:'walking',3:'sleeping'};
    },
    makePhenotypeSelect: function(){
        phenos = app.getPhenotypes();
        $('#phenotype_select').html('');
        for (p in phenos){
            $('#phenotype_select').append('<option value="'+ p +'">'+ phenos[p] + '</option>');
        }
        $('#phenotype_select').append('<option value="new">New Phenotype</option>'); 
        // to do: add listener to show an input box when "New" is chosen
    },
    phenoSelectListener: function(){
        if ($(this).val() == 'new'){
            $('#new_phenotype').show();
        } else {
            $('#new_phenotype').hide();
        }
    },
    obsActivitySelectListener: function(){
        // get value of li
        activity = $(this).text();
        activity_id = $(this).attr('data-actid');
        is_ready = app.showConfirm('Start '+ activity + '?');
        if (is_ready){
            console.log('ready to start');
            app.trackObserverActivityTime();
            app.current_obs_activity.activity_id = activity_id;
            app.current_obs_activity.activity_name = activity;
            //app.debug('activity: '+ activity + ' id: '+ activity_id);
            // show only the activity that's been chosen
            $(this).addClass('activity_selected');
            $('#obs_activity_list > li').not('.activity_selected').hide();
            $('#activity_info').hide();
            //TODO: move the selected info to a fixed bar, so you can see what your current status is
            //change page with jqm
            //$.mobile.changePage($('#sighting'));
            // show sighting section
            //$('#sighting').show();
        } else {
            console.log('NOT ready to start');
        }
    },
    savePhenotypeSighting: function(){
        // object structure
        /*obj = { 
            phenotype_id: 0,
            phenotype_name: "",
            phenotype_notes: "",
            frequency: 0.0
        };*/
        //ps.phenotype_id = 0;
        ps = {};
        // is this ia new phenotype
        if ($('#new_phenotype').val().length > 2){
            ps.phenotype_name = $('#new_phenotype').val();
        } else {
            ps.phenotype_id = $('#phenotype_select').val();
            ps.phenotype_name = $('#phenotype_select option:selected').text();
        }
        ps.frequency = $('#frequency_input').val()/100;
        ps.phenotype_notes = $('#pheno_notes').val();
        app.current_sighting.phenotype_sightings.push(ps);
        
        // add to display list of stored records
        $('#pheno_obs_records').show();
        $('#pheno_obs_records ul').append('<li>' + ps.phenotype_name + ' ' + ps.frequency+'</li>');

        // clear/reset all the values
        $('#frequency_input').val(50);
        $('#frequency_slider').val(50);
        $('#pheno_notes').val('');
        $('#new_phenotype').val('');
        $('#new_phenotype').hide();

        // remove selected phenotype from array -- each can only be used once per sighting
        $('#phenotype_select option:selected').remove();
        console.log(app.current_sighting);

    },
    // sync the frequency slider value with the frequency input box value when either changes
    frequencySync: function(){
        if ($(this).attr('id') == 'frequency_input'){ 
            $('#frequency_slider').val($(this).val());
        } else if ($(this).attr('id') == 'frequency_slider'){
            $('#frequency_input').val($(this).val());
        }
        //console.log ("INPUT: "+ $('#frequency_input').val());
        //console.log ("SLIDER: "+ $('#frequency_slider').val());
    },
    couchSync: function(){
        dBase.sync();
    },
    debug: function(log){
        $('#msg').append(log + "<br/>");
    },
    // use native alert when available
    showAlert: function (message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    },
    // use native confirm when available
    showConfirm: function (message) {
        if (navigator.notification) {
            return navigator.notification.confirm(message);
        } else {
            return confirm(message);
        }
    }

    /*
    resetDB: function(){
        alert('db reset');
        dBase.reset();
    }*/

};
 /*
set-up procedure: 
    get list of activities from central database - before 1st use and periodically, 
        depending on whether others are using app
    one-time step: get agesex options from db -- specific to a particular study
    get list of phenotypes (periodic update?)

    should there be a special couchDB db for set-up parameters to run on start-up?

notes:
pg time format is: 2014-03-24 15:57:25.377317+00

TODO:
once stored in pg, update couch to hold the sighting_id (so it doesn't get added again), 
    then update device records from couch 
*/

