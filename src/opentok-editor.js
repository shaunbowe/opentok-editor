var OpenTokEditor = angular.module('opentok-editor', ['opentok'])
.directive('otEditor', ['OTSession', '$window', function (OTSession, $window) {
  return {
    restrict: 'E',
    scope: {
        modes: '='
    },
    template: '<div class="opentok-editor-mode-select" ng-show="!connecting">' +
      '<select ng-model="selectedMode" name="modes" ng-options="mode.name for mode in modes"></select>' +
      '</div>' +
      '<div ng-if="connecting" class="opentok-editor-connecting">Connecting...</div>' +
      '<div><div class="opentok-editor"></div></div>',
    link: function (scope, element, attrs) {
      var opentokEditor = element.context.querySelector('div.opentok-editor'),
          modeSelect = element.context.querySelector('select'),
          myCodeMirror,
          cmClient,
          doc,
          session = OTSession.session;
      scope.connecting = true;
      var selectedMode = scope.modes.filter(function (value) {return value.value === attrs.mode;});
      scope.selectedMode = selectedMode.length > 0 ? selectedMode[0] : scope.modes[0];

      var createEditorClient = function(revision, clients) {
          if (!cmClient) {
            cmClient = new ot.EditorClient(
              revision,
              clients,
              new OpenTokAdapter(session),
              new ot.CodeMirrorAdapter(myCodeMirror)
            );
            scope.$apply(function () {
              scope.connecting = false;
            });
          }
      };

      var sessionConnected = function () {
        myCodeMirror = CodeMirror(opentokEditor, attrs);
        if (doc) {
            myCodeMirror.setValue(doc.str);
        }
        setTimeout(function () {
            // We wait 2 seconds for other clients to send us the doc before
            // initialising it to empty
            createEditorClient(0, []);
        }, 2000);
      };

      session.on({
        sessionConnected: function (event) {
          sessionConnected();
        },
        connectionCreated: function (event) {
          if (cmClient && event.connection.connectionId !== session.connection.connectionId) {
            session.signal({
              type: 'opentok-editor-doc',
              to: event.connection,
              data: JSON.stringify({
                revision: cmClient.revision,
                clients: cmClient.clients,
                str: myCodeMirror.getValue()
              })
            });
          }
        },
        'signal:opentok-editor-doc': function (event) {
          doc = JSON.parse(event.data);
          if (myCodeMirror) {
            myCodeMirror.setValue(doc.str);
          }
          createEditorClient(doc.revision, doc.clients);
        }
      });
      
      if (session.isConnected()) {
        sessionConnected();
      }
      
      scope.$watch('selectedMode', function () {
        if (myCodeMirror) {
          myCodeMirror.setOption("mode", scope.selectedMode.value);
        }
      });
    }
  };
}]);