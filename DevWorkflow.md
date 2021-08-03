#Developer Workflow

###GitFlow
The advantage of using git flow is it enables a larger number of devs.
https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow



#Gradle
The main gradle targets are `gradle build` and `gradle test`.  
To see an example build run, view:  
https://scans.gradle.com/s/d6lkpjixeoqeg

##Local Setup
Add the google-java-format plugin to your IDE and enable it.  


##CI

There are 2 config files used for CI.   The main view for the actions can be seen [here] 
(https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
)


###Test Coverage
To view test coverage for a given build, 

###Code Formatter
The code formatter is google-java-formatter.  
It is implemented in 2 places, one locally, configured to run on save. 
The other is a github action that reports non conforming files.

In order to prevent code-format commits from polluting the repository, add 
commits to the file `.git-blame-ignore-revs`, and add the following to your git config:
To ignore formatter commits, run the following, either locally or globally:
`git config blame.ignoreRevsFile .git-blame-ignore-revs`

###Analytics
https://sonarcloud.io/dashboard?id=lmohseni-smc_BlueWave
##Slack Integration
//TODO