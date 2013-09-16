To do:
======

Milestone tasks
---------------

#### Core Game Mechanics

* [x] Create Engine
* [x] Networking
* [x] 3D rendering
* [x] Camera controls
* [x] Click-to-move
* [x] Pathfinding
* [x] Basic zombie AI
* [x] Cache objects (instead of loading them each time it is created)
* [ ] Swarm AI
* [x] Unit selection (selected object is selectedObj variable)
	* [x] Rewrite entire object naming system to allow selected units to be stored and used by the server
* [x] Health
* [x] Reproduction of units
* [x] Player attacking zombies
* [ ] Player attacking players
* [ ] Scoreboard
* [ ] Win Game
* [-] Building placement
* [ ] Destructable buildings
* [ ] Resource collection
* [ ] Resource sharing between units
* [ ] Resource storing in buildings

#### Gameplay Elements

* [ ] Grace period (set-up time)

Less important tasks
--------------------

* [ ] Fix height detection (optimise raytracing or predefine height)
* [ ] Create textures
* [ ] Add character animations
* [ ] Balance speed of units
* [ ] Fix camera rotations for Player 2
* [x] Make zombie spawn points (instead of tracked object position)
	* [ ] Refine zombie spawn points
* [x] Make player spawn points
	* [ ] Make object-specific spawn points
* [ ] Add background image
	* [ ] Make background image scroll with camera

Tasks to do over time
---------------------

* [ ] Fix FPS lag
* [ ] Fix latency issues
* [ ] Optimise memory usage
* [ ] Optimise network usage
* [ ] Create tests (QUnit)
* [ ] Playtest game

Things to fix
-------------

* [x] Fix zombies not despawning when player disconnected
* [ ] Allow zombies to change target
* [ ] Allow for multiple levels to be loaded
* [ ] Stress test server for latency, stability and data integrity (networking)
* [ ] Fix scaling of pathfinding data vs. real geometry position (pathfinding is currently off scale)
* [ ] Rescale objects

Optional milestones
-------------------

* [ ] Procedural resource placement
* [ ] Procedural map generation
* [ ] Zombification of dead units
