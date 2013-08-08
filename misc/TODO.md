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
* [ ] Set up multi-threading via the child_process module (server only) to do the heavy processing (to attempt to remedy latency)
* [ ] Swarm AI
* [ ] Unit selection
* [ ] Health
* [ ] Reproduction of units
* [ ] Building placement
* [ ] Destructable buildings
* [ ] Resource collection
* [ ] Resource sharing between units
* [ ] Resource storing in buildings

#### Gameplay Elements

* [ ] Grace period (set-up time)

Less important tasks
--------------------

* [ ] Create textures
* [ ] Add character animations
* [ ] Balance speed of units
* [ ] Make zombie spawn points (instead of tracked object position)
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
