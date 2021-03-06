/**
 * Copyright ©2018. The Regents of the University of California (Regents). All Rights Reserved.
 *
 * Permission to use, copy, modify, and distribute this software and its documentation
 * for educational, research, and not-for-profit purposes, without fee and without a
 * signed licensing agreement, is hereby granted, provided that the above copyright
 * notice, this paragraph and the following two paragraphs appear in all copies,
 * modifications, and distributions.
 *
 * Contact The Office of Technology Licensing, UC Berkeley, 2150 Shattuck Avenue,
 * Suite 510, Berkeley, CA 94720-1620, (510) 643-7201, otl@berkeley.edu,
 * http://ipira.berkeley.edu/industry-info for commercial licensing opportunities.
 *
 * IN NO EVENT SHALL REGENTS BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL,
 * INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF
 * THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF REGENTS HAS BEEN ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * REGENTS SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE
 * SOFTWARE AND ACCOMPANYING DOCUMENTATION, IF ANY, PROVIDED HEREUNDER IS PROVIDED
 * "AS IS". REGENTS HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES,
 * ENHANCEMENTS, OR MODIFICATIONS.
 */

(function(angular) {

  'use strict';

  angular.module('collabosphere').factory('userFactory', function(utilService, $cacheFactory, $http) {

    /**
     * Get all users in the current course
     *
     * @param  {Boolean}           [track]                Whether to track the user request in analytics. Defaults to true
     * @param  {Boolean}           [includeLastActivity]  Whether to include last activity timestamps. Defaults to false
     * @return {Promise<User[]>}                          $http promise returning all users in the current course
     */
    var getAllUsers = function(track, includeLastActivity) {
      var url = '/users';

      var queryParams = [];
      // Disable analytics tracking only if explicitly told to.
      if (track === false) {
        queryParams.push('track=false');
      }
      if (includeLastActivity === true) {
        queryParams.push('includeLastActivity=true');
      }
      if (queryParams.length) {
        url += '?' + queryParams.join('&');
      }

      return $http.get(utilService.getApiUrl(url));
    };

    /**
     * Get user of current course by id
     *
     * @param  {Number}            id             Id of desired user
     * @return {Promise<User[]>}                  $http promise returning user of the current course
     */
    var getUser = function(id) {
      return $http.get(utilService.getApiUrl('/users/id/' + id));
    };

    /**
     * Get the users in the current course and their points
     *
     * @param  {Boolean}            trackEvent      Default is true. If false then skip AnalyticsAPI step to track event.
     * @return {Promise<User[]>}                    $http promise returning the users in the current course and their points
     */
    var getLeaderboard = function(trackEvent) {
      var track = trackEvent === null || _.isUndefined(trackEvent) || trackEvent;
      var apiPath = track ? '/users/leaderboard' : '/users/leaderboard?track=false';
      return $http.get(utilService.getApiUrl(apiPath))
        .then(function(response) {
          var users = response.data;

          // Order the users by points
          users = users.sort(function(a, b) {
            return b.points - a.points;
          });

          // Add the rank information onto each user
          if (users[0]) {
            users[0].rank = 1;
          }
          for (var i = 1; i < users.length; i++) {
            // Users with the same score will have the same rank
            if (users[i].points === users[i - 1].points) {
              users[i].rank = users[i - 1].rank;
            } else {
              users[i].rank = (i + 1);
            }
          }

          return users;
        });
    };

    /**
     * Update the points share status for a user. This will determine whether the user's
     * points are shared with the course
     *
     * @param  {Boolean}            share         Whether the user's points should be shared with the course
     * @return {Promise}                          $http promise
     */
    var updateSharePoints = function(share) {
      var update = {
        'share': share
      };
      return $http.post(utilService.getApiUrl('/users/me/share'), update).then(function() {
        // Remove the me object from the cache as its `share_points` value is now updated
        var $httpDefaultCache = $cacheFactory.get('$http');
        $httpDefaultCache.remove(utilService.getApiUrl('/users/me'));
      });
    };

    /**
     * Update the current user's looking-for-collaborators status
     *
     * @param  {Boolean}            looking       Whether the user is looking for collaborators
     * @return {Promise}                          $http promise
     */
    var updateLookingForCollaborators = function(looking) {
      var update = {
        'looking': looking
      };
      return $http.post(utilService.getApiUrl('/users/me/looking_for_collaborators'), update).then(function() {
        // Remove the me object from the cache as its `looking_for_collaborators` value is now updated
        var $httpDefaultCache = $cacheFactory.get('$http');
        $httpDefaultCache.remove(utilService.getApiUrl('/users/me'));
      });
    };

    return {
      'getAllUsers': getAllUsers,
      'getUser': getUser,
      'getLeaderboard': getLeaderboard,
      'updateLookingForCollaborators': updateLookingForCollaborators,
      'updateSharePoints': updateSharePoints
    };

  });

}(window.angular));
