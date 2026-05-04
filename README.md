# Jac-Of-All-Trades
## Raik-284H Repository for team Jac Of All Trades
- [Setup](#setup-the-code)
- [Downloading Docker Desktop](#downloading-docker-desktop)
- [Runnging Docker](#to-run-docker-file)
- [How to see frontend](#how-to-see-frontend)
- [How to Play](#playing-the-game)



### Setup the code
On the git hub repository click the green code putting and open code in github desktop, then the editor of your choice.

Once the code has been pulled and opened in the editor of your choice there is one file that must be ended. In the root directory folder Jac-Of-All-Trades add the .end file with the MONGO and Firebase strings in them. Save the file before exiting. 

### TO RUN DOCKER FILE
Download Docker Desktop on your computer.
Once you have downloaded your docker and logged in open the desktop app. 

Next go to vs code and in the command line of the project
run the command : 
```
docker compose up --build
```
When the container is running skip the next step and continue to How to See Frontend. When completely finished with the game use the following command to shut down the container.
When you are done with the code run the command : 
```
docker compose down 
```
### HOW TO SEE FRONTEND
To see the front end development live you can open your web browser and enter: 

http://localhost:5173/

Once you have done this once the next time you open up your browser you should be able to type: 

**localhost:5173**

The docker environment actively updates when you save files, so if you make any changes you can save the file and it will be applied live. 

### PLAYING THE GAME

Once you have opened the game, continue to sign in. Once signed in you will have the option to create or join a game, or choose hotseat mode if you are on a singular device. 

How to play:

Stratego is a "fog of war" game where you cannot see your opponenets pieces. The goal is to capture the opponenets flag before they capture yours. 
Once loaded into a lobby there will be a list of all your pieces to setup on the left side of the board. Feel free to randomize if you are unfamiliar with Stratego or want a challenge. Then once your board is prepared click confirm setup in the bottom left. Once both oppenents have set up the game starts with Red. Here is a quick rule overview. 

#### BOARD
The board is a ten by ten area, where each piece is set up in the four by ten area on their side. In the middle of the board there are two blue four by four squares that no piece can move over, and they represent lakes. The rest of the board is free.

#### MOVEMENT
Stratego pieces can only move one square horizontally or vertically in any direction besides the lakes. The only exception is the two, known as the scout, who can move any number of squares in those directions. This does not include over lakes. Bombs and the Flag are unable to move. When one piece moves onto the square of another piece not of its color the pieces battle. 

#### BATTLES
In a battle the piece who moved onto the occupied square is the attacker, and the stationary piece is the defender. The piece with the highest number wins the battle except for a few key scenarios. On a tie both pieces are removed. The bomb defeats all numbers in battle excepts the three, otherwise known as the miner, who defuses the bomb. The ten can defeat all pieces except the bomb when attacking. The one, known as the spy, can defeat only the ten when attacking, and loses to everything, including the ten, when defending. 

#### HOW TO WIN
There are two ways to win in Stratego. The first and most common way to win is to capture the oponents flag by starting a battle with the square the flag is on. In some unique scenarios you may find yourself unable to get the flag, such as when it is surrounded by bombs and you are out of miners. This brings us to the second win condition. If a player runs out of pieces, or is unable to move any pieces during their turn (trapped behind their own bombs) that player forfeits and automatically loses. If a player loses all pieces before capturing the flag they also lose, even if the flag is unachievable for the remaining player. 