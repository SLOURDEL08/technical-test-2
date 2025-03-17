import React, { useState, useEffect } from "react";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import api from "./../services/api";

const UserWorkComparison = ({ projectId, date }) => {
  const [usersActivities, setUsersActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserActivities = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/activity?projectId=${projectId}&date=${date.getTime()}`);
        const { data: users } = await api.get("/user");

        const activitiesByUser = {};

        data.forEach((activity) => {
          const userId = activity.userId;

          if (!activitiesByUser[userId]) {
            const user = users.find((u) => u._id === userId) || {
              name: "Unknown User",
              avatar: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
            };

            activitiesByUser[userId] = {
              userId,
              userName: user.name,
              userAvatar: user.avatar,
              totalHours: 0,
              detailedHours: [],
            };
          }

          const totalHours = activity.detail.reduce((sum, day) => sum + day.value, 0);
          activitiesByUser[userId].totalHours += totalHours;

          activity.detail.forEach((day) => {
            if (day.value > 0) {
              activitiesByUser[userId].detailedHours.push({
                date: new Date(day.date).toLocaleDateString(),
                hours: day.value,
              });
            }
          });
        });

        const usersList = Object.values(activitiesByUser).sort((a, b) => b.totalHours - a.totalHours);
        setUsersActivities(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user activities:", error);
        setLoading(false);
      }
    };

    if (projectId && date) {
      fetchUserActivities();
    }
  }, [projectId, date]);

  if (loading) {
    return <div className="py-4 text-center">Chargement des données...</div>;
  }

  if (usersActivities.length === 0) {
    return <div className="py-4 text-center">Aucune donnée d'activité trouvée pour ce projet</div>;
  }

  const totalProjectHours = usersActivities.reduce((total, user) => total + user.totalHours, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-2">
      <h3 className="text-md font-semibold mb-4">Répartition des heures travaillées</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Vue d'ensemble</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Total heures : {(totalProjectHours / 8).toFixed(2)} jours ({totalProjectHours} heures)
            </span>
          </div>
          {usersActivities.map((user, index) => (
            <div key={user.userId || index} className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <img src={user.userAvatar} alt={user.userName} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-medium">{user.userName}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {(user.totalHours / 8).toFixed(2)} jours ({user.totalHours}h)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(user.totalHours / totalProjectHours) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Détail par utilisateur</h4>
          {usersActivities.map((user, index) => (
            <UserDetailItem key={user.userId || index} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

const UserDetailItem = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3 border border-gray-100 rounded-lg p-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <img src={user.userAvatar} alt={user.userName} className="w-6 h-6 rounded-full" />
        <span className="text-sm font-medium">{user.userName}</span>
        <span className="text-xs text-gray-500 ml-auto">{(user.totalHours / 8).toFixed(2)} jours</span>
        {expanded ? <IoMdArrowDropup className="text-gray-500" /> : <IoMdArrowDropdown className="text-gray-500" />}
      </div>

      {expanded && user.detailedHours.length > 0 && (
        <div className="mt-2 pl-8 text-xs">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-1">Date</th>
                <th className="pb-1 text-right">Heures</th>
              </tr>
            </thead>
            <tbody>
              {user.detailedHours.map((day, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-1">{day.date}</td>
                  <td className="py-1 text-right">{day.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserWorkComparison;
