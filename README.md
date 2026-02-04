# Jac-Of-All-Trades
## Raik-284H Repository for team Jac Of All Trades
- [Viewing ReadME in VSCODE](#viewing-readme-in-vscode)
- [Github Commands:](#github-commands)
   - [Branches](#branches)
        - [Making a new Change](#making-a-new-change)
        - [Continuing Changes](#continuing-changes)
        - [Committing Changes](#committing-changes)
    -[Restoring files](#restoring-files)
    -[Pull Request](#pull-request)
    -[Merge Conflicts](#merge-conflicts)
    -[Cleaning Up](#cleaning-up)
- [Connecting to Mongo](#connecting-to-mongodb)
- [Downloading Docker Desktop](#downloading-docker-desktop)
- [Runnging Docker](#to-run-docker-file)
- [How to see frontend](#how-to-see-frontend)
- [Helpful Debugging](#helpful-debugging-commands)

### Viewing ReadME in VSCODE
To view the ReadME in vscode right click on the ReadME and select 'Open Preview.' Each section is linked at the top for faster navigation. 

### GITHUB COMMANDS
When using github NEVER push directly to main. In this section there will be commands to help make your changes safely without messing up any previous files or code. 

#### Branches
Every time you make direct changes to the code, we will no longer push to the 'main branch'. Instead you will make a new branch that you will push your changes to, then when finished one other member of the team will look over the code with you, and you will merge it into the new branch. With new files this will be less of a problem, but if two people change the same file it can get messy.

##### Making a new change
This section is for starting a new change to the code, whether it is a bugfix, new feature, etc. If you have already started your changes but did not finish or are pulling somebody elses changes go to [Continuing Changes](#continuing-changes)
```
git checkout main
git pull origin main
git checkout -b feature/feature-name
```
git checkout main - this switches the branch you are currently on back to the main branch. You want to do this everytime before you pull any code. 

git pull origin main - this pulls the files from main onto your computer so that you are up to date with the latest code. 

git checkout -b feature/feature-name - this is the line that actually creates a new branch and switches you into the new branch. The -b is what tells git that you are making a new branch, while checkout switches the branch.  The naming convention for branches is generally what you've added/changed (feature, bugfix, doc) and the feature-name is the name of what you're adding or fixing. 

##### **Continuing Changes**
This section is for continuing work on a branch that you, or somebody else is working on but has not merged with main yet. If you are starting a new change go to [Making a new change](#making-a-new-change).
```
git checkout feature/feature-name
git pull origin feature/feature-name
```
git checkout feature/feature-name - this switches the branch you are currently on to the feature branch for the changes

git pull origin feature/feature-name - this pulls the files from github to your files locally so you can change them.

#### Committing Changes
This section is for committing changes you made.
```
git status
git add .
git commit -m "Message of commit"
git push origin feature/feature-name
```
git status - this shows you what you have changed since your last commit.
git add . - this adds all of your files in the branch to your commit. If you just want to add one file you can replace the . with the file name you'd like to add ex. git add filename.js
git commit -m "Message of commit" - this commits the branch and files locally to your computer. Just committing **WILL NOT** put it on the cloud for everybody to see.
git push origin feature/feature-name - this pushes all your files to the cloud for everybody to see.

#### Restoring files
If you do end up making a mistake or needing to scrap a file you can grab the original with:
```
git restore filename
```
#### Pull Request
One you have pushed your files in a seperate branch online you can now make a pull request on Github.com. To do this open the repository and look on the top bar for pull request. Create a pull request adding a description of what you changed, and comparing it with main. Then inform a teammate and do nothing until the teammate has reviewed and okayed the request. Then once oakyed you can merge the branch to main.

#### Merge conflicts
If you do end up having a merge conflict with your branch here is how you can fix it.
```
git checkout feature/feature-name
git pull origin main
```
These two lines of code will open your branch and pull the main branch into them to compare the two.
Git will mark your changes from the main with <<<<<<< HEAD
The divider between the two will be =======
Git will mark the main branch code with >>>>>>> main

When you open the file manually delete the markers and edit the code so that it has the correct changes, whether it is both, one, or the other. Then save the file and once try committing your branch changes once again: [Committing changes](#committing-changes).

#### Cleaning up
After you have finished merging and you no longer need your feature branch (make sure everything is working first) you can delete the branch.
```
git checkout main
git pull origin main
git branch -d feature/feature-name
```
git branch -d feature/feature-name - deletes the branch. 

### **CONNECTING TO MONGODB**
When you pull from github you will be missing a file in the root directory. This is because connecting to the mongo database requires a connection string which contains the username and password to access our database. This is not secure and cannot be pushed to github, so you will need to get the link seperately ***(Jac has it)***.
In the Jac-of-All-Trades folder you will need to make a new file called '.env'.  Once the file is made you will add the connection string. You should be able to run the docker without this file it just will not connect to Mongo.


### DOWNLOADING DOCKER DESKTOP
A docker file downloads all dependencies for you, so technically you need nothing but Docker Desktop downloaded. It also ensures that it runs smoothly between Mac, Linux, and Windows. 

### TO RUN DOCKER FILE
Download Docker Desktop on your computer.
If you have a Mac M1-4 chip download the sillicon version. Once you have downloaded your docker and logged in open the desktop app. 

Next go to vs code and in the command line of the project
run the command : 
```
docker compose up --build
```
This will run the program, make sure that no errors happen. 
When you are done with the code run the command : 
```
docker compose down. 
```
### HOW TO SEE FRONTEND
To see the front end development live you can open your web browser and enter: 

http://localhost:5173/

Once you have done this once the next time you open up your browser you should be able to type: 

**localhost:5173**

The docker environment actively updates when you save files, so if you make any changes you can save the file and it will be applied live. 

### Helpful debugging commands
if you get stuck in the terminal at any point in time you can use the command "control c" to return back to the root directory. If that doesn't work you can just open a new terminal. 

If you think either the backend or the frontend has shut off or you need to check the status you can run:
```
docker compose ps
```  
or you can run
```
docker compose logs -f 
```
Running the latter will show you logs for both the backend and frontend, if any errors happen then you should be able to see them in the logs.  
If you just want to see the logs for on or the other you can attach to the end of the command either frontend or backend like such: 
```
docker compose logs -f backend
```




