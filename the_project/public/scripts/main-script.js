$(function() {
    for (var i = 0; i < QUESTIONS.length; i++) {
        $('.progress').append('<div class="progress-point"></div>');
    }
    continue_form_flow();
    updateResourceId();
    updateEmbed();
    $("#email-form").submit(function() {
        var value = $('#name-2').val();
        $("#submit-button").attr("disabled", "disabled");
        setValueToConfig(value);
        $("#main-chat-div").append(message_right(value));
        continue_form_flow();
        $('#name-2').val("");
        updateEmbed();
        return false;
    });
    $('#download-button').click(function() {
        $(this).attr("disabled", "disabled");
        $.ajax({
            url: 'http://localhost:8000/generateAll',
            type: "POST",
            dataType: 'json',
            data: CONFIG,
            success: function(result) {
                var path = 'http://localhost:8000/' + result.fileName;
                PDF_RESULT = path;
                $("#open-button").fadeIn();
            },
            error: function(xhr, resp, text) {
                console.log(xhr, resp, text);
            }
        });
        followPercentage();
    });
    $("#open-button").click(function() {
        window.open(PDF_RESULT, '_blank');
    });
    $("#arrow-right").click(function() {
        if (CONFIG.resourceId < TOTAL_PAGES) {
            CONFIG.resourceId++;
            updateEmbed();
            updateResourceId();
        }
    });
    $("#arrow-left").click(function() {
        if (CONFIG.resourceId > 0) {
            CONFIG.resourceId--;
            updateEmbed();
            updateResourceId();
        }
    });
});

function followPercentage() {
    $.ajax({
        url: 'http://localhost:8000/getPercentage',
        type: "get",
        success: function(result) {
            console.log(result);
            $("#downloadDivContainer progress").val(result.percentage * 100);
            if (result.percentage != 1) {
                setTimeout(function() {
                    followPercentage();
                }, 500);
            }
        },
        error: function(xhr, resp, text) {
            console.log(xhr, resp, text);
        }
    });
}

function updateResourceId() {
    $("#resourceIdText > span").text("Preview: Page " + (CONFIG.resourceId + 1));
}

function updateEmbed() {
    $("#embedAnimationSlide").fadeOut(500);
    $.ajax({
        url: 'http://localhost:8000/generatePagePdf',
        type: "POST",
        dataType: 'json',
        data: CONFIG,
        success: function(result) {
            var params = '#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0'
            var path = 'http://localhost:8000/' + result.fileName;
            $('#pdfViewer').attr('src', path + params);
            if (QUESTION_NUMBER < QUESTIONS.length) {
                $("#submit-button").removeAttr("disabled");
            }
            $("#embedAnimationSlide").fadeIn(500);
        },
        error: function(xhr, resp, text) {
            console.log(xhr, resp, text);
        }
    })
}

function continue_form_flow() {
    QUESTION_NUMBER++;
    $(".progress-point").removeClass('current');
    $(".progress-point:eq(" + QUESTION_NUMBER + ")").addClass('current');
    if (QUESTION_NUMBER >= QUESTIONS.length) {
        $("#downloadDivContainer").fadeIn();
        $("#submit-button").attr("disabled", "disabled");
    } else {
        $("#main-chat-div").append(message_left(QUESTIONS[QUESTION_NUMBER]));
    }
    $("#main-chat-div").scrollTop($('#main-chat-div')[0].scrollHeight);
}


function message_right(text) {
    return `<div class="message-div right"><div class="message right"><div>${text}</div></div><img src="images/avatar-mom.svg" class="avatar"></div>`;
}

function message_left(text) {
    return `<div class="message-div"><img src="images/avatar-boy.svg" class="avatar"><div class="message left"><div>${text}</div></div></div>`;
}

function setValueToConfig(value) {
    if (QUESTION_NUMBER === 0) {
        CONFIG.MY_NAME = value;
    }
    if (QUESTION_NUMBER === 1) {
        CONFIG.MY_AGE = value;
    }
    if (QUESTION_NUMBER === 2) {
        CONFIG.MOM_NAME = value;
    }
    if (QUESTION_NUMBER === 3) {
        CONFIG.DAD_NAME = value;
    }
    if (QUESTION_NUMBER === 4) {
        CONFIG.DOG_NAME = value;
    }
    if (QUESTION_NUMBER === 5) {
        CONFIG.MESSAGE = value;
    }
}

var QUESTION_NUMBER = -1;

var QUESTIONS = [
    "Hey! I’m the character of the child.&nbsp; What’s my name?",
    "How old am I?",
    "What's my mother's name?",
    "What's my father's name?",
    "What's the dog's name?",
    "Leave a secret message for me."
];

var CONFIG = {
    resourceId: 0,
    CREATE_DATE: moment().format('MMMM Do, YYYY'),
    MY_NAME: '',
    MY_AGE: '',
    MOM_NAME: '',
    DAD_NAME: '',
    DOG_NAME: '',
    MESSAGE: ''
}
var PDF_RESULT = "";

var TOTAL_PAGES = 20;
