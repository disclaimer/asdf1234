/* a function which performs zerofill on a numeric */
var paddy = function (n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
};

/* the default alarm list */
var data = [];

/* the default sounds for selection */
var bells = [{ name: 'Bell', type: 'audio/mpeg', path: 'sounds/1.mp3' }, { name: 'Alien', type: 'audio/mpeg', path: 'sounds/2.mp3' }, { name: 'Digital', type: 'audio/mpeg', path: 'sounds/3.mp3' }, { name: 'Reveille', type: 'audio/mpeg', path: 'sounds/4.mp3' }];

/* A clock component displaying the current time */
var Clock = React.createClass({
    displayName: 'Clock',

    getInitialState: function () {
        return { time: new Date(), id: 0 };
    },
    componentDidMount: function () {
        var state = this.state;
        state.id = setInterval(function () {
            var state = this.state;
            state.time = new Date();
            this.setState(state);
        }.bind(this), 1000);
        this.setState(state);
    },
    componentWillUnmount: function () {
        clearInterval(this.state.id);
    },
    render: function () {
        return React.createElement('div', { className: 'panel panel-default' },
            React.createElement('div', { className: 'panel-heading' },
                React.createElement('h3', { className: 'panel-title' }, 'Current time')
            ),
            React.createElement('div', { className: 'panel-body' },
                React.createElement(
                    'h4',
                    { className: 'text-center wall-clock' },
                    $.format.date(this.state.time, 'HH:mm:ss')
                )
            )
        );
    }
});

/* A component for selecting and playing a sound */
var Bell = React.createClass({
    displayName: 'Bell',

    ring: function () {
        this.refs.audio.getDOMNode().load();
        this.refs.audio.getDOMNode().play();
    },
    getInitialState: function () {
        return {
            bell: this.props.bells[0],
            inputURL: '',
            errorFile: false,
            errorURL: false
        };
    },
    getDefaultProps: function () {
        return {
            bells: [],
            onAddAudio: function (file) {
                console.log(file);
            }
        };
    },
    handleChange: function (event) {
        var key = event.target.value;
        this.setState({
            bell: this.props.bells[key]
        });
    },
    handlePlay: function () {
        this.refs.audio.getDOMNode().load();
        this.refs.audio.getDOMNode().play();
    },
    handleInputURL: function (event) {
        this.setState({ inputURL: event.target.value });
    },
    handleStop: function () {
        this.refs.audio.getDOMNode().pause();
    },
    render: function () {
        var options = this.props.bells.map(function (bell, i) {
            return React.createElement(
                'option',
                { value: i, key: i },
                bell.name
            );
        });
        var errorAlert = React.createElement(
            'div',
            { className: 'alert alert-danger' },
            'Unsupported audio type'
        );
        return React.createElement(
            'div',
            { className: 'bell' },
            React.createElement(
                'audio',
                { ref: 'audio', loop: true },
                React.createElement('source', { src: this.state.bell.path }),
                'Your browser does not support the audio element.'
            ),
            React.createElement(
                'div',
                { className: 'form' },
                React.createElement(
                    'div',
                    { className: 'form-group form-inline' },
                    React.createElement(
                        'select',
                        { className: 'form-control', onChange: this.handleChange },
                        options
                    ),
                    React.createElement(
                        'button',
                        { className: 'btn btn-primary', onClick: this.handlePlay },
                        React.createElement('span', { className: 'glyphicon glyphicon-play' })
                    ),
                    React.createElement(
                        'button',
                        { className: 'btn btn-default', onClick: this.handleStop },
                        React.createElement('span', { className: 'glyphicon glyphicon-stop' })
                    )
                )
            )
        );
    }
});

/* A single alarm record */
var AlarmEntry = React.createClass({
    displayName: 'AlarmEntry',

    enable: function () {
        var currentTime = new Date();
        var interval = this.props.time.getHours() * 3600 + this.props.time.getMinutes() * 60 + this.props.time.getSeconds();
        interval -= currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
        interval *= 1000;

        if (interval < 0) interval += 86000 * 1000;

        var id = setTimeout(function () {
            this.setState($.extend(this.state, { enable: false }));
            this.props.onRing();
            this.disable();
        }.bind(this), interval);

        var state = this.state;
        state.intervalId = id;
        this.setState(state);
    },
    disable: function () {
        var state = this.state;
        clearTimeout(state.intervalId);
        state.intervalId = 0;
        this.setState(state);
    },
    handleCheck: function (event) {
        var state = this.state;
        state.enable = event.target.checked;
        this.setState(state);

        this.handleSwitch();
    },
    handleSwitch: function () {
        if (this.state.enable && this.state.intervalId == 0) this.enable();else if (!this.state.enable && this.state.intervalId != 0) this.disable();
    },
    getInitialState: function () {
        return { time: this.props.time, comment: this.props.comment, enable: true, intervalId: 0 };
    },
    getDefaultProps: function () {
        return {
            onRing: function () {},
            onClose: function () {},
            enable: true,
            comment: '',
            time: new Date()
        };
    },
    componentDidMount: function () {
        this.handleSwitch();
    },
    componentWillUnmount: function () {
        clearTimeout(this.state.intervalId);
    },
    render: function () {
        return React.createElement(
            'li',
            { className: 'list-group-item' },
            React.createElement(
                'span',
                { className: 'label label-default'},
                $.format.date(this.state.time, 'HH:mm:ss')
            ),
            React.createElement(
                'span',
                null,
                this.state.comment
            ),
            React.createElement('input', { type: 'checkbox', onChange: this.handleCheck, ref: 'checkbox', checked: this.state.enable })
        );
    }
});

/* Alarm list */
var AlarmList = React.createClass({
    displayName: 'AlarmList',

    getInitialState: function () {
        return { data: this.props.data };
    },
    handleEntryClose: function (index) {
        var state = this.state;
        state.data.splice(index, 1);
        this.setState(state);
    },
    handleAddEntry: function (entry) {
        var state = this.state;
        state.data.push(entry);
        this.setState(state);
    },
    render: function () {
        var alarmNodes = this.state.data.map(function (alarm, i) {
            if (alarm === undefined) return undefined;
            return React.createElement(AlarmEntry, { time: alarm.time, comment: alarm.comment, onClose: this.handleEntryClose.bind(this, i), key: i, onRing: this.props.onRing });
        }.bind(this));

        var list = function () {
            if (this.state.data.length == 0) {
                return React.createElement(
                    'li',
                    { className: 'list-group-item text-muted' },
                    'No alarm set.'
                );
            } else {
                return alarmNodes;
            }
        }.bind(this);

        return React.createElement(
            'ul',
            { className: 'alarmList list-group' },
            list()
        );
    }
});

/* A component for selecting a number */
var AlarmDigit = React.createClass({
    displayName: 'AlarmDigit',

    getInterval: function (counter) {
        if (counter > 5) return 75;else if (counter > 20) return 50;else if (counter > 30) return 5;else return 150;
    },
    getInitialState: function () {
        var val = typeof this.props.val !== 'undefined' ? this.props.val : 0;
        return { value: val, increasing: 0, decreasing: 0, increaseCounter: 0, decreaseCounter: 0 };
    },
    handleCarry: function () {
        this.handleIncrease(true);
    },
    handleBorrow: function () {
        this.handleDecrease(true);
    },
    handleIncrease: function (once) {
        var state = this.state;
        state.value++;
        state.increaseCounter++;
        if (state.value >= this.props.numberSystem) {
            if (typeof this.props.onCarry === 'function') this.props.onCarry();
            state.value = 0;
        }

        if (once !== true) state.increasing = setTimeout(this.handleIncrease, this.getInterval(this.state.increaseCounter));
        this.setState(state);
    },
    handleStartIncrease: function () {
        var state = this.state;
        state.increaseCounter = 0;
        this.setState(state);
        this.handleIncrease();
    },
    handleStopIncrease: function () {
        var state = this.state;
        clearTimeout(state.increasing);
        this.setState(state);
    },
    handleDecrease: function (once) {
        var state = this.state;
        state.value--;
        state.decreaseCounter++;
        if (state.value < 0) {
            if (typeof this.props.onBorrow === 'function') this.props.onBorrow();
            state.value = this.props.numberSystem - 1;
        }
        if (once !== true) state.decreasing = setTimeout(this.handleDecrease, this.getInterval(this.state.decreaseCounter));
        this.setState(state);
    },
    handleStartDecrease: function () {
        var state = this.state;
        state.decreasing = true;
        state.decreaseCounter = 0;
        this.setState(state);
        this.handleDecrease();
    },
    handleStopDecrease: function () {
        var state = this.state;
        clearTimeout(state.decreasing);
        this.setState(state);
    },
    handleChange: function (event) {
        var value = event.target.value.slice(-2);
        if (value >= this.props.numberSystem) value = event.target.value.slice(-1);
        console.log(value);
        this.setState($.extend(this.state, { value: value }));
    },
    handleKeyDown: function (event) {
        if (event.keyCode == 38) {
            this.handleIncrease(true);
        }

        if (event.keyCode == 40) {
            this.handleDecrease(true);
        }
    },
    handleWheel: function (event) {
        event.preventDefault();
        if (event.deltaY > 0) {
            this.handleDecrease(true);
        }
        if (event.deltaY < 0) {
            this.handleIncrease(true);
        }
    },
    render: function () {
        var value = paddy(this.state.value, 2);
        return React.createElement(
            'div',
            { className: 'alarmDigit alarm-digit col-xs-4' },
            React.createElement(
                'button',
                { className: 'increase btn btn-default', onMouseDown: this.handleStartIncrease, onMouseUp: this.handleStopIncrease },
                React.createElement('span', { className: 'glyphicon glyphicon-menu-up', 'aria-hidden': 'true' })
            ),
            React.createElement('input', { className: 'form-control text-center', type: 'text', value: value, onChange: this.handleChange, onKeyDown: this.handleKeyDown, onWheel: this.handleWheel }),
            React.createElement(
                'button',
                { className: 'decrease btn btn-default', onMouseDown: this.handleStartDecrease, onMouseUp: this.handleStopDecrease },
                React.createElement('span', { className: 'glyphicon glyphicon-menu-down', 'aria-hidden': 'true' })
            )
        );
    }
});

/* main component */
var Alarm = React.createClass({
    displayName: 'Alarm',

    getInitialState: function () {
        return { bells: bells };
    },
    handleCarry: function (digit) {
        this.refs[digit].handleCarry();
    },
    handleBorrow: function (digit) {
        this.refs[digit].handleBorrow();
    },
    handleRing: function () {
        this.refs.bell.ring();
    },
    handleAddAlarm: function () {
        var date = new Date();
        date.setHours(this.refs.hourDigit.state.value);
        date.setMinutes(this.refs.minuteDigit.state.value);
        date.setSeconds(this.refs.secondDigit.state.value);
        this.refs.alarmList.handleAddEntry({ time: date, comment: this.refs.comment.getDOMNode().value });
    },
    handleAddAudio: function (audio) {
        this.setState({
            bells: this.state.bells.concat(audio)
        });
    },
    render: function () {
        var date = new Date();
        return React.createElement(
            'div',
            { className: 'alarm' },
            React.createElement(Clock, null),
            React.createElement(
                'div',
                { className: 'alarm-container' },
                React.createElement('div', { className: 'panel panel-default' },
                    React.createElement('div', { className: 'panel-heading' },
                        React.createElement('h3', { className: 'panel-title' }, 'Alarm time')
                    ),
                    React.createElement('div', { className: 'panel-body' },
                        React.createElement(
                            'div',
                            { className: 'alarm-digits row' },
                            React.createElement(AlarmDigit, { numberSystem: 24, val: date.getHours(), ref: 'hourDigit' }),
                            React.createElement(AlarmDigit, { numberSystem: 60, val: date.getMinutes(), onCarry: this.handleCarry.bind(this, 'hourDigit'), onBorrow: this.handleBorrow.bind(this, 'hourDigit'), ref: 'minuteDigit' }),
                            React.createElement(AlarmDigit, { numberSystem: 60, val: date.getSeconds(), onCarry: this.handleCarry.bind(this, 'minuteDigit'), onBorrow: this.handleBorrow.bind(this, 'minuteDigit'), ref: 'secondDigit' })
                        ),
                        React.createElement(
                            'div',
                            { className: 'form-inline text-center comment' },
                            React.createElement('input', { className: 'form-control', type: 'text', ref: 'comment', placeholder: 'Your alarm title (optional)', ref: 'comment' }),
                            React.createElement(
                                'button',
                                { className: 'btn btn-default', type: 'button', onClick: this.handleAddAlarm },
                                React.createElement('span', { className: 'glyphicon glyphicon-plus', 'aria-hidden': 'true' })
                            )
                        ),
                        React.createElement('hr', null),
                        React.createElement(AlarmList, { data: data, ref: 'alarmList', onRing: this.handleRing })
                    )
                ),
                React.createElement('div', { className: 'panel panel-default' },
                    React.createElement('div', { className: 'panel-body' },
                        React.createElement(Bell, { ref: 'bell', bells: this.state.bells, onAddAudio: this.handleAddAudio })
                    )
                )
            )
        );
    }
});

React.render(React.createElement(Alarm, null), document.getElementById('content'));
