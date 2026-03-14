# validate-build

Runs the validation phase after application implementation.

This skill performs the following pipeline:

1. testRunner  
2. qaValidator  

Purpose:

- generate automated backend and frontend tests
- execute the test suite
- validate that generated features match the implementation plan
- ensure architecture rules are satisfied before deployment

The skill uses an orchestrator to run the modules responsible for each step.
