import React from 'react';

const StyledVenueTable = ({ venues }) => {
  return (
    <div className="w-full flex justify-center">
      <table className="w-full max-w-3xl border-collapse bg-gray-800/50 rounded-lg overflow-hidden shadow-lg">
        <thead className="bg-purple-900/50">
          <tr>
            <th className="py-3 px-4 text-left text-purple-200 font-semibold border-b-2 border-purple-500/30">Venue Name</th>
            <th className="py-3 px-4 text-left text-purple-200 font-semibold border-b-2 border-purple-500/30">Type</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((venue) => (
            <tr
              key={venue.name}
              className="border-b border-purple-500/20 hover:bg-purple-900/20 transition-colors duration-200"
            >
              <td className="py-3 px-4 border-r border-purple-500/20">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-400"></span>
                  <span className="font-medium text-white">{venue.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-purple-200">
                {venue.name.toLowerCase().includes('lab') ? 'Laboratory' :
                  venue.name.toLowerCase().includes('hall') ? 'Hall' :
                    venue.name.toLowerCase().includes('classroom') ? 'Classroom' :
                      'Room'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StyledVenueTable;