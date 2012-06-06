
jQuery(document).ready(function ($) {

    // Returns the total seconds played
    function secondsFromTime(selector) {
        var text = $(selector).text();
        var segments = /(\d+):(\d+)/.exec(text);
        return segments == null ? -1 : Number(segments[1]) * 60 + Number(segments[2])
    }

    var songChanged = true;

    var nowPlaying = {};

    $('#player-current-time').bind('DOMSubtreeModified', function (e) {

        var elapsedTime = e.srcElement.innerHTML;

        // DOM elements are empty every other call... ignore those events
        if (elapsedTime == "") {
            return;
        }

        // Compute the remaining time if the song has changed
        var duration = secondsFromTime('#player-total-time');
        var elapsed = secondsFromTime('#player-current-time');
        var remaining = songChanged ? duration - elapsed  : 0;
        
        if (elapsedTime == "0:00") {
            songChanged = true;
            console.log('Song changed due to 0:00');
            chrome.extension.sendRequest({ type: 'reset' });
        }
        else if (songChanged && remaining > 0 && elapsed > 5) {

            var song = {
                track: $('#player-track a').text().trim(), 
                artist: $('#player-artist a').text().trim()
            };

            if (song.track == nowPlaying.track) {
                console.log('Ignoring changed song due to non-updated track', { Previous: nowPlaying, Current: song });
                return;
            }

            song.duration = duration;
            song.remaining = remaining;

            console.log('Song changed', song);

            // if track list deleted
            if (song.duration > 35 && song.artist != '' && song.track != '') {

                console.log('Updating', song);

                chrome.extension.sendRequest({ type: 'validate', artist: song.artist, track: song.track }, function (response) {

                    console.log('Song Validated', song);

                    // If validation fails we don't scrobble? that's ok?
                    if (response) {
                        console.log('track info modified: submit');
                        chrome.extension.sendRequest({ type: 'nowPlaying', artist: song.artist, track: song.track, duration: song.duration });
                    }
                    else {
                        console.log('Ignoring song due to failed metadata validation', song);
                    }
                });

                // Song sucessfully changed
                songChanged = false;
                nowPlaying = song;

            }
            else {

                if (song.duration <= 35) {
                    songChanged = false;
                }

                console.log('Invalid duration, track or artist', song);
            }

        }

        console.log(elapsedTime);
    });



    $(window).unload(function () {
        // reset the background scrobbler song data
        chrome.extension.sendRequest({ type: 'reset' });
        return true;
    });


});


