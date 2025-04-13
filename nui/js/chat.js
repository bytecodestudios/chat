const chatList = document.querySelector('#chat-list');

let chatData = [];

const createChat = data => {
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');
    chatItem.innerHTML = `
        <div class="chat-type ${data.typeClass || 'system'}">${data.typeClass || 'system'}</div>
        <p class="chat-content"><span class="chat-sender">${data.args[0]}</span> ${data.args.slice(1, data.args.length).join(' ')}</p>
    `;
    return chatItem;
}

const renderChat = () => {
    const html = chatData.map(createChat).reverse();
    chatList.innerHTML = '';
    chatList.append(...html);
    $('.chat-list-wrapper').scrollTop(chatList.scrollHeight);
}

renderChat();

const data = {}
const commandsHistory = new Set();

let currentSuggestions = [];
let currentParams = [];
let currentSelection = 0;
let currentCommand = '';
let currentActive = '';

const chatInput = $('.chat-input');
chatInput.on('keydown', function (e) {
    // Return on pressing slash
    // if (e.keyCode === 191 || e.keyCode === 111) return false;

    // tab
    if (e.keyCode === 9) {
        e.preventDefault();
    }

    // up
    if (e.keyCode === 38) {
        e.preventDefault();
    }

    // down
    if (e.keyCode === 40) {
        e.preventDefault();
    }
});

const renderSuggestions = (input, forceRender) => {
    const args = input.split(' ');
    if (args.length === 1 || forceRender) {
        $('#suggestion-list').html('');
        currentSuggestions = [];
        let index = 0;
        Object.keys(data).forEach(key => {
            if (index == 5) return;
            if (key.startsWith(forceRender ? input.trim() : input) && input !== '') {
                index++;
                currentSuggestions.push(key);
                const command = data[key];
                const params = command.params;
                currentActive = key;
                let html = '';
                html += `<div class="suggestion-item ${key + 'wrapper'} ${currentSuggestions.length > 0 && currentSuggestions[0] === key && currentSelection === 0 ? 'current-selection' : ''}" >
                    <div class="suggestion-content">
                        <span class="active ${key}">${key}</span> ${params?.length > 0 ? params?.map(param => `<span class="${param.name}">[${param.name}]</span>`).join(' ') : ''}
                        </div >
                    <div class="suggestion-helper">
                        ${data[key].help || ''}
                    </div>
                </div>`;
                $('#suggestion-list').append(html);
            }
        });
    }
    if (args.length > 1 && data[args[0]]) {
        currentParams = data[currentActive]?.params;
        if (!currentParams || currentParams?.length == 0) return
        if (args.length > currentParams.length + 1) return
        $(`.active`).removeClass('active')
        $(`.${currentParams[args.length - 2].name}`).addClass('active')
        if (!currentParams[args.length - 2].help) return $('.suggestion-helper').html('')
        $('.suggestion-helper').html(currentParams[args.length - 2].help);
    }
}
let historyIndex = 0;
chatInput.on('keyup', function (e) {
    currentCommand = $(this).val();
    renderSuggestions($(this).val());
    // up
    if (e.keyCode === 38) {
        if (currentSuggestions.length == 0) {
            if (historyIndex > 0) {
                $(this).val([...commandsHistory.values()][historyIndex - 1])
                historyIndex--;
            }
            return false
        }
        document.querySelectorAll(`.${currentSuggestions[currentSelection] + 'wrapper'} `).forEach(el => {
            el.classList.remove('current-selection');
        });
        currentSelection--;
        if (currentSelection < 0) {
            currentSelection = currentSuggestions.length - 1;
        }
        document.querySelectorAll(`.${currentSuggestions[currentSelection] + 'wrapper'} `).forEach(el => {
            el.classList.add('current-selection');
        });
    }
    // down
    if (e.keyCode === 40) {
        if (currentSuggestions.length == 0) {
            if (historyIndex < commandsHistory.size) {
                $(this).val([...commandsHistory.values()][historyIndex + 1])
                historyIndex++;
            }
            return false
        }
        document.querySelectorAll(`.${currentSuggestions[currentSelection] + 'wrapper'} `).forEach(el => {
            el.classList.remove('current-selection');
        });
        currentSelection++;
        if (currentSelection === currentSuggestions.length) {
            currentSelection = 0;
        }
        document.querySelectorAll(`.${currentSuggestions[currentSelection] + 'wrapper'} `).forEach(el => {
            el.classList.add('current-selection');
        });
    }


    // tab
    if (e.keyCode === 9) {
        if ($(this).val().split(' ').length > 1) return;
        if (currentSuggestions.length === 0) return;
        $('.chat-input').val(currentSuggestions[currentSelection] + ' ');
        renderSuggestions(currentSuggestions[currentSelection] + ' ', true);
        currentSelection = 0;
        document.querySelectorAll(`.${currentSuggestions[currentSelection] + 'wrapper'} `).forEach(el => {
            el.classList.add('current-selection');
        });
    }

    // enter
    if (e.keyCode === 13) {
        if (currentCommand.length > 0) {
            if (commandsHistory.has(currentCommand)) commandsHistory.delete(currentCommand);
            commandsHistory.add(currentCommand);
            historyIndex = commandsHistory.size;
            $.post(`https://${GetParentResourceName()}/chatResult`, JSON.stringify({ message: currentCommand }))
            // closeChat();
            $('.chat-input-wrapper').fadeOut(240);
            setTimeout(() => {
                if (!$(".chat-input").is(":focus")) {
                    $('.chat-wrapper').css('display', 'none');
                }
            }, 6000)
            $.post(`https://${GetParentResourceName()}/closeChat`)
            reset();
        } else {
            closeChat();
        }
    }
});

const reset = () => {
    $('.chat-input').val('');
    $('#suggestion-list').html('');
}

const openChat = () => {
    $('.chat-wrapper').fadeIn(240);
    $('.chat-input-wrapper').fadeIn(240);
    $('.chat-input').focus();
    historyIndex = commandsHistory.size;
}

const closeChat = () => {
    $('.chat-wrapper').fadeOut(240);
    setTimeout(() => {
        $('.chat-input-wrapper').fadeOut(240);
        reset();
        $.post(`https://${GetParentResourceName()}/closeChat`);
    }, 100)

}

const sendMessage = (data) => {
    chatData.push(data)
    $('.chat-wrapper').css('display', 'block');
    renderChat();
    setTimeout(() => {
        if (!$(".chat-input").is(":focus")) {
            $('.chat-wrapper').css('display', 'none');
        }
    }, 6000)
}

const addSuggestion = (suggestion) => {
    if (suggestion.name.charAt(0) == '/') {
        suggestion.name = suggestion.name.slice(1, suggestion.name.length);
    }
    data[suggestion.name] = {
        help: suggestion.help,
        params: suggestion.params
    }
}

const removeSuggestion = (name) => {
    data[name] = null
}

const clearChat = () => {
    chatData = [];
    console.log(chatData);
    renderChat();
}

$('body').on('keyup', (e) => {
    if (e.keyCode === 27) {
        closeChat()
    }
})

$(document).on('focusin', 'input, textarea', function () {
    $.post(`https://${GetParentResourceName()}/isTyping`, JSON.stringify({ isTyping: true }));
}).on('focusout', function () {
    $.post(`https://${GetParentResourceName()}/isTyping`, JSON.stringify({ isTyping: false }));
});

window.addEventListener('message', function (e) {
    const data = e.data
    switch (data.type) {
        case 'ON_OPEN':
            return openChat();
        case 'ON_MESSAGE':
            return sendMessage(data.message);
        case 'ON_SUGGESTION_ADD':
            return addSuggestion(data.suggestion);
        case 'ON_SUGGESTION_REMOVE':
            return removeSuggestion(data.name);
        case 'ON_CLEAR':
            return clearChat();
        default:
            return;
    }
})
openChat();