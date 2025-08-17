import './Sidebar.css'
import React, { useState } from 'react'
import { AlignJustify, CirclePlus, Search } from 'lucide-react';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollape = () => {
        setIsCollapsed(!isCollapsed);
    }

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : 'open'}`}>
            <div className="sidebar-header">
                <button onClick={toggleCollape}>
                    <AlignJustify className='icon' />
                </button>
            </div>
            <div className="sidebar-body">
                <div className="sidebar-actions">
                    <div className="action">
                        <button className='action-btn'>
                            <CirclePlus />
                            {isCollapsed === false && <span>New</span>}
                        </button>
                    </div>
                    <div className="action">
                        <button className='action-btn'>
                            <Search />
                            {isCollapsed === false && <span>Search</span>}
                        </button>
                    </div>
                </div>
                {!isCollapsed &&
                    <div className="recents">
                        <span>Recents</span>
                        <div className="recent-columns">
                            <div className="recent-item">
                                <button>Project 1</button>
                            </div>
                            <div className="recent-item">
                                <button>Project 2</button>
                            </div>
                            <div className="recent-item">
                                <button>Project 3</button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default Sidebar