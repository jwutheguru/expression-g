chrome.runtime.onMessage.addListener(function(request, sender, responseCallback) {
    if (!request || !request.command)
        return;

    switch (request.command) {
        case 'search':
            search(request.regexStr);

            break;
        case 'clear':
            clearSearch(function() {
                responseCallback();
            });

            break;
        default:
        break;
    }
});

function search(regexStr, callback) {
    var regex = new RegExp(regexStr, 'gim');

    document.body.normalize();

    var nodeIterator = document.createNodeIterator(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        {
            acceptNode: function(node) {
                return NodeFilter.FILTER_ACCEPT;
                if (node.parentNode && node.parentNode.hasAttribute('data-expression-g-matched'))
                    return NodeFilter.FILTER_REJECT;
                else
                    return NodeFilter.FILTER_ACCEPT;
            }
        });

    var nodesToProcess = [];

    var regexCounter = 0;
    var currentNode;

    while (currentNode = nodeIterator.nextNode()) {
        nodesToProcess.push(currentNode);
    }

    for (var a = 0; a < nodesToProcess.length; a++) {
        currentNode = nodesToProcess[a];

        var nodeText = currentNode.nodeValue;
        var matches = nodeText.match(regex);

        if (!matches || matches.length === 0)
            continue;

        var parentNode = currentNode.parentNode;
        var textIdx = 0;
        var highlight;

        var newNode = document.createDocumentFragment();
        //newNode.setAttribute('data-expression-g-matched', 'true');

        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            var matchIdx = nodeText.indexOf(match, textIdx);

            var prevTextPortion = document.createTextNode(nodeText.substring(textIdx, matchIdx));
            newNode.appendChild(prevTextPortion);

            highlight = document.createElement('mark');
            highlight.id = '__expression-g-match-' + (regexCounter++) + '__'; // ex: __expression-g-match-42__
            highlight.classList.add('__expression-g-highlight__');

            highlight.appendChild(document.createTextNode(match));

            newNode.appendChild(highlight);

            textIdx = matchIdx + match.length;
        }

        // lastly add remaining text before replacing original node with new node
        var remainderTextPortion = document.createTextNode(nodeText.substring(textIdx));
        newNode.appendChild(remainderTextPortion);

        parentNode.replaceChild(newNode, currentNode);
    }

    if (typeof callback === 'function')
        callback.apply(null, null);
}

function clearSearch(callback) {
    var highlights = document.querySelectorAll('mark.__expression-g-highlight__');

    for (var i = 0; i < highlights.length; i++) {
        var highlight = highlights[i];
        var textNode = document.createTextNode(highlight.textContent);

        highlight.parentNode.insertBefore(textNode, highlight);
        highlight.parentNode.removeChild(highlight);
    }

    document.body.normalize();

    if (typeof callback === 'function')
        callback.apply(null, null);
}