var api = require('../../lib/api');
var reportError = require('../../lib/errors');

function findLandingPage(pages) {
  var result;
  // ... first, try to select 0, 0
  pages.forEach((page) => {
    if (page.coords.x === 0 && page.coords.y === 0) {
      result = page;
    }
  });
  // ... and if it was deleted, select the first page in the array
  return result || pages[0];
}

module.exports = {
  uri: function () {
    return `/users/${this.state.params.user}/projects/${this.state.params.project}/pages`;
  },

  load: function () {
    this.setState({loading: true});
    api({uri: this.uri()}, (err, data) => {

      this.setState({loading: false});

      if (err) {
        reportError('Error loading project', err);
      } else if (!data || !data.pages) {
        reportError('No project found...');
      } else {
        var state = {
          isFirstLoad: false
        };
        var pages = this.formatPages(data.pages);

        // Set cartesian coordinates
        this.cartesian.allCoords = pages.map(el => el.coords);

        state.pages = pages;

        var landingPage = findLandingPage(pages);
        var {x, y} = this.cartesian.getFocusTransform(landingPage.coords, this.state.matrix[0]);

        if (this.state.params.mode === 'play' && typeof this.state.isFirstLoad) {
          this.zoomToPage(landingPage.coords);
        } else if (this.state.params.mode === 'edit' && !this.state.selectedEl) {
          state.selectedEl = landingPage.id;
          state.matrix = [this.state.matrix[0], 0, 0, this.state.matrix[0], x, y];
        } else if (this.state.isFirstLoad) {
          state.matrix = [this.state.matrix[0], 0, 0, this.state.matrix[0], x, y];
        }

        this.setState(state);

        // Highlight the source page if you're in link destination mode
        if (this.state.params.mode === 'link') {
          if (window.Platform) {
            this.highlightPage(this.state.routeData.pageID, 'source');
          }
        }
      }
    });
  }
};
