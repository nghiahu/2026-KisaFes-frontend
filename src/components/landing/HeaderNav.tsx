export default function HeaderNav() {
  return (
    <ul className="hidden lg:flex items-center gap-8">
      <li>
        <a href="#dashboards" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          Dashboards
        </a>
      </li>
      <li>
        <a href="#projects" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          Projects
        </a>
      </li>
      <li>
        <a href="#issues" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          Issues
        </a>
      </li>
      <li>
        <a href="#teams" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          Teams
        </a>
      </li>
    </ul>
  )
}
